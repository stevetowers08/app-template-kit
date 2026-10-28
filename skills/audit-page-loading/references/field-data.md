# Field data sources and platform reads

Use the first source that has data. A repo script that already wraps one of these (look for a
`vitals` or `perf` script in `package.json`) beats running the raw query yourself.

## Contents
1. PostHog `$web_vitals` (HogQL)
2. Attribution events, and the minimal reporter that emits them
3. Vercel Speed Insights
4. CrUX API (public pages only)
5. Vercel project and deployment (REST)

## 1. PostHog `$web_vitals`

PostHog's autocapture emits `$web_vitals` with `$web_vitals_<NAME>_value` properties (LCP, INP,
CLS, FCP; TTFB only if the app sends it). Query with a personal API key (`phx_...`, query scope),
from the credentials store, never pasted into chat.

```bash
curl -s -X POST "$POSTHOG_HOST/api/projects/$POSTHOG_PROJECT_ID/query/" \
  -H "Authorization: Bearer $POSTHOG_PERSONAL_API_KEY" -H "Content-Type: application/json" \
  -d @- <<'EOF'
{"query":{"kind":"HogQLQuery","query":"SELECT properties.$pathname AS route, count() AS n, round(quantile(0.75)(toFloat(properties.$web_vitals_LCP_value))) AS lcp, round(quantile(0.75)(toFloat(properties.$web_vitals_INP_value))) AS inp, round(quantile(0.75)(toFloat(properties.$web_vitals_CLS_value)),3) AS cls, round(quantile(0.75)(toFloat(properties.$web_vitals_FCP_value))) AS fcp, round(quantile(0.75)(toFloat(properties.$web_vitals_TTFB_value))) AS ttfb FROM events WHERE event = '$web_vitals' AND timestamp > now() - INTERVAL 30 DAY GROUP BY route ORDER BY n DESC LIMIT 60"}}
EOF
```

- `$pathname` and `$host` need the `properties.` prefix in HogQL.
- Filter to production hosts (`AND properties.$host IN (...)`) so previews and localhost do not mix in.
- Dynamic segments (`/items/<id>`) appear as separate rows; group them by pattern when judging a
  route type, but keep the raw rows for `n`.

## 2. Attribution events

Native `$web_vitals` has no breakdown. The breakdown needs `web-vitals/attribution` and custom
events. If the app does not send them, recommend this reporter (a client component mounted once in
the root layout; production only). Unknown attribution parts are sent as `null`, never `0`.

```tsx
"use client";
import { useEffect } from "react";
import posthog from "posthog-js";

const ms = (v: number | undefined) => (v === undefined ? null : Math.round(v));

export function VitalsAttribution() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    import("web-vitals/attribution").then(({ onLCP, onINP, onCLS }) => {
      const path = () => window.location.pathname;
      onLCP(({ value, attribution: a }) => posthog.capture("$web_vitals_lcp_attribution", {
        $pathname: path(), lcp_value: ms(value), lcp_element: a.target ?? null,
        lcp_ttfb: ms(a.timeToFirstByte), lcp_resource_load_delay: ms(a.resourceLoadDelay),
        lcp_resource_load_duration: ms(a.resourceLoadDuration), lcp_element_render_delay: ms(a.elementRenderDelay),
      }));
      onINP(({ value, attribution: a }) => posthog.capture("$web_vitals_inp_attribution", {
        $pathname: path(), inp_value: ms(value), inp_element: a.interactionTarget ?? null,
        inp_type: a.interactionType ?? null, inp_load_state: a.loadState ?? null,
        inp_input_delay: ms(a.inputDelay), inp_processing_duration: ms(a.processingDuration),
        inp_presentation_delay: ms(a.presentationDelay),
      }));
      onCLS(({ value, attribution: a }) => posthog.capture("$web_vitals_cls_attribution", {
        $pathname: path(), cls_value: Math.round(value * 1000) / 1000, cls_element: a.largestShiftTarget ?? null,
        cls_largest_shift_value: a.largestShiftValue ?? null, cls_load_state: a.loadState ?? null,
      }));
    });
  }, []);
  return null;
}
```

Breakdown queries (same endpoint):

```sql
-- LCP: the four parts sum to LCP; the largest names the fix
SELECT properties.$pathname AS route, count() AS n,
  round(quantile(0.75)(toFloat(properties.lcp_value))) AS lcp,
  round(quantile(0.75)(toFloat(properties.lcp_ttfb))) AS ttfb,
  round(quantile(0.75)(toFloat(properties.lcp_resource_load_delay))) AS load_delay,
  round(quantile(0.75)(toFloat(properties.lcp_resource_load_duration))) AS load_dur,
  round(quantile(0.75)(toFloat(properties.lcp_element_render_delay))) AS render_delay,
  topK(1)(properties.lcp_element) AS element
FROM events WHERE event = '$web_vitals_lcp_attribution' AND timestamp > now() - INTERVAL 30 DAY
GROUP BY route ORDER BY n DESC LIMIT 40

-- INP phases
SELECT properties.$pathname AS route, count() AS n,
  round(quantile(0.75)(toFloat(properties.inp_value))) AS inp,
  round(quantile(0.75)(toFloat(properties.inp_input_delay))) AS input_delay,
  round(quantile(0.75)(toFloat(properties.inp_processing_duration))) AS processing,
  round(quantile(0.75)(toFloat(properties.inp_presentation_delay))) AS presentation,
  topK(1)(properties.inp_element) AS element
FROM events WHERE event = '$web_vitals_inp_attribution' AND timestamp > now() - INTERVAL 30 DAY
GROUP BY route ORDER BY n DESC LIMIT 40

-- CLS element, and the share of shifts after load (a refetch or late insert)
SELECT properties.$pathname AS route, count() AS n,
  round(quantile(0.75)(toFloat(properties.cls_value)), 3) AS cls,
  round(countIf(properties.cls_load_state = 'complete') / count(), 2) AS after_load,
  topK(1)(properties.cls_element) AS element
FROM events WHERE event = '$web_vitals_cls_attribution' AND timestamp > now() - INTERVAL 30 DAY
GROUP BY route ORDER BY n DESC LIMIT 40
```

Each P75 column is computed independently, so the four LCP parts at P75 only approximately sum to
P75 LCP. Read them as proportions.

## 3. Vercel Speed Insights

Dashboard only (no public query API). The free tier shows the Real Experience Score and the FCP/LCP
views; per-metric breakdowns, INP/CLS detail and element selectors need Speed Insights Plus. Use it
to confirm a trend, not for the per-route breakdown.

## 4. CrUX API

Only for public, indexed pages with enough Chrome traffic; signed-in app routes usually return 404
(no data), which is `SKIPPED (no CrUX data)`, not zero.

```bash
curl -s "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=$CRUX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"origin":"https://example.com","formFactor":"PHONE"}'
```

Swap `origin` for `url` for one page. P75 is in `record.metrics.<metric>.percentiles.p75`.

## 5. Vercel project and deployment (REST)

Token and team id come from the credentials store (global CLAUDE.md). Write responses to the
scratchpad and print only the fields below; never print env values.

```bash
curl -s -H "Authorization: Bearer $TOKEN" "https://api.vercel.com/v9/projects/$PROJECT?teamId=$TEAM"
#   serverlessFunctionRegion, resourceConfig.functionDefaultRegions, resourceConfig.fluid,
#   skewProtectionMaxAge (absent = Skew Protection off), speedInsights, rootDirectory, nodeVersion
curl -s -H "Authorization: Bearer $TOKEN" "https://api.vercel.com/v6/deployments?projectId=$PROJECT&teamId=$TEAM&target=production&limit=20"
#   deploy frequency (created), state
curl -s -H "Authorization: Bearer $TOKEN" "https://api.vercel.com/v13/deployments/<deployment-url>?teamId=$TEAM"
#   regions actually used (vercel.json "regions" overrides the project default), alias
```

Compare the function region with the database region (from the repo's architecture docs or the DB
provider's project settings). A distant pair costs one round trip per query, multiplied by every
sequential await.
