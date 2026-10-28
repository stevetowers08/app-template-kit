# audit-performance — check catalogue

Front-end performance for a React app — **measure where possible, grep where not**. Verified against
the Next.js 16 release notes, web.dev Core Web Vitals, and the 2026 "measure the production build,
prefer field data over lab" consensus.

## Detect the stack FIRST (this skill is stack-adaptive)

Read `package.json` + config before running anything:

| Detect | How | Effect |
|---|---|---|
| Next.js App Router | `next` dep + `app/` dir | enable the Next-gated checks (PERF2 RSC, PERF6) |
| Next.js Pages Router | `next` + `pages/` only | RSC checks → `N/A`; bundle/CWV/asset checks still run |
| Vite / CRA SPA | `vite`/`react-scripts` | RSC/async-params → `N/A`; bundle via the SPA build, CWV, assets run |
| Remix / TanStack Start / Expo | their deps | run universal checks; mark framework-specific ones `N/A (not Next App Router)` |
| React Compiler on | `reactCompiler: true` in config | re-render findings → `N/A (compiler handles memoization)` |

**Universal checks** (run on any React stack): bundle size, Core Web Vitals, asset optimisation,
fetch waterfalls, heavy client deps. **Next-gated checks**: RSC boundary, async params,
`cacheComponents`, Suspense streaming, `force-dynamic`. Mark gated checks `N/A` off-Next, don't fail them.

## Static vs measured

- **Static** (always run): grep the source for the smells below.
- **Measured** (run when the source is available): build the app and read real numbers; query field
  data. If a measurement source is missing, mark it `SKIPPED (<reason>)` — **never fabricate a number
  or a score**. Always measure the **production build** (`npm run build`), never dev.

## Contents
PERF1 Bundle size & weight (measured) · PERF2 Client/server boundary · PERF3 Data fetching & caching
· PERF4 Core Web Vitals (measured) · PERF5 Asset & layout stability · PERF6 Streaming & rendering ·
Cross-cutting: auth flash · Auto-fix summary

---

## PERF1. Bundle size & weight (weight: 22) — MEASURED

### PERF1a. First Load JS per route — HIGH (the ground truth)
Next 16 prints no size columns from `next build`; use `npx next analyze --output` (16.4+; `next experimental-analyze`
on 16.1-16.3) or Lighthouse/field data. Next 15 and earlier print a `Route … First Load JS` table.
```
npx next analyze --output    # Next 16.4+; Next 15 and earlier: parse the `npm run build` route table; SPA: read dist/ asset sizes
```
Thresholds (2026 B2B SaaS consensus): **warn > 200 kB, problem > 300 kB** First Load JS per route.
Report the worst routes with their real sizes. `SKIPPED (build failed/unavailable)` if it won't build.
Also available: `mcp__vercel__get_deployment_build_logs` (real build output from the last deploy).

### PERF1b. Bundle composition — MEDIUM
What's actually in the heavy bundles.
```
npx next analyze --output    # Next 16.4+; @next/bundle-analyzer is webpack-only
```
Flag large single packages landing in a client bundle (a date/markdown/icon lib that could be
server-side or tree-shaken). Report.

### PERF1c. Heavy client dependency — HIGH (static signal feeding PERF1a)
```
grep -rln "'use client'" src app | xargs grep -lnE "from '(date-fns|moment|lodash|@?recharts|chart\.js|markdown|@fullcalendar)" 2>/dev/null
```
A heavy lib inside a client component ships to the browser. Fix: move the work to a Server Component
or `next/dynamic`. Report (it's the *cause* behind a big PERF1a number).

## PERF2. Client/server boundary (weight: 20) — Next App Router; else N/A

### PERF2a. `'use client'` on a layout/wrapper — HIGH
A `'use client'` on a non-leaf pulls all its imports into the client bundle and hydrates a big tree
(a top INP killer — 40+ interactive cards under one boundary measured 380-520 ms INP).
```
grep -rln "'use client'" src app | xargs grep -lE 'layout|provider|wrapper|container|shell' 2>/dev/null
```
Fix: push `'use client'` to the leaf; use the donut/slot pattern (pass Server Components as `children`).
Read each file to confirm. Report.

### PERF2b. Client-only lib not dynamically imported — MEDIUM
Libs touching `window` (maps, editors) imported statically → SSR `window is not defined` / extra JS.
Fix: `next/dynamic(..., { ssr: false })` (Client Components only). Report.

### PERF2c. Re-render hygiene — LOW (N/A if React Compiler on)
Inline `{}`/`[]`/arrow props on hot mapped lists, when `reactCompiler` is OFF.
```
grep -rnE '\.map\(' src   # lists passing inline props to children
```
Fix: enable React Compiler (preferred over hand `useMemo`/`useCallback`). If on, mark `N/A`. Report.

## PERF3. Data fetching & caching (weight: 18)

### PERF3a. Fetch waterfall — HIGH (static smell + measured truth)
Dependent-looking `await`s that could be parallel, and parent→child fetch chains across components.
```
grep -rnE 'await .*\n\s*await ' src app    # local heuristic; ALSO trace parent/child server-component fetch chains
```
Static grep catches the obvious in-file case; it MISSES cross-component waterfalls — so when running
live (see PERF4), confirm with the network panel / `mcp__vercel__get_runtime_logs` request timing.
Fix: `Promise.all([...])` or sibling Suspense-wrapped Server Components. Report.

### PERF3b. TanStack Query without `staleTime` — MEDIUM
`staleTime: 0` (default) refetches on every mount/focus.
```
grep -rnE 'useQuery\(' src | xargs grep -Ln 'staleTime'
```
Fix: set a sensible `staleTime`. Report.

### PERF3c. `force-dynamic` on a cacheable page — MEDIUM (Next)
```
grep -rn "dynamic = 'force-dynamic'" app    # drops the CDN cache
```
Fix: remove, or adopt `cacheComponents`/`use cache` for the dynamic parts only. Report.
Under Cache Components the `dynamic`, `revalidate` and `fetchCache` route segment exports fail the build, so
with `cacheComponents` on each one is a build error to remove.

## PERF4. Core Web Vitals (weight: 20) — MEASURED

Thresholds (web.dev): **LCP ≤ 2.5 s · INP ≤ 200 ms · CLS ≤ 0.1 · TTFB ≤ 800 ms · TBT ≤ 200 ms**.
INP replaced FID. **Pick the source by context** — most audits here run in **dev**, so lab is primary.

### PERF4a. Lab data — the DEV-PRIMARY signal (Lighthouse on the PRODUCTION build)
In dev there are no real users, so lab is what you have. Lighthouse MUST run against a production
build — `next dev` gives misleading scores (unoptimised bundles, no static gen; a near-empty page can
score 40). Build, start, then measure:
```
npm run build && npm run start        # NEVER point Lighthouse at `next dev`
npx lighthouse http://localhost:3000 --only-categories=performance --output=json --quiet
# or the one-shot CI tool: npx @lhci/cli autorun   (build assumed done; asserts thresholds)
```
Lab (Lighthouse navigation mode) gives **LCP, CLS, FCP, TTFB, and TBT**. Navigation mode **cannot measure INP** -
report TBT (≤200 ms) as the diagnostic proxy and say so; timespan mode with scripted input can. Do NOT print
an INP number from navigation mode or "convert" TBT→INP (the correlation is imperfect, ~0.78). Report each lab metric vs threshold + the LCP element / top long
tasks. `SKIPPED (app did not build/run)` if it won't.

### PERF4b. Field data (real users) — POST-DEPLOY ONLY (SKIPPED in dev)
Google ranks on field (CrUX p75) data, and **real INP only exists here** — but field data needs a
deployed app with real traffic (CrUX needs ~1,000 page-loads over 28 days). **In a dev/pre-deploy
audit this is unavailable: mark `SKIPPED (field data is post-deploy only)`.** When auditing a deployed
app, read it:
- **PostHog** (`mcp__claude_ai_PostHog__exec`): query `$web_vitals` events for p75 LCP/INP/CLS (follow
  the MCP discover→info→call flow; confirm the event exists via `read-data-schema` first).
- **Vercel Speed Insights** (`@vercel/speed-insights`) / CrUX via PageSpeed Insights.
Report p75 per metric (including **real INP**) vs thresholds. If the app is deployed but captures no
web-vitals, recommend adding `@vercel/speed-insights` or the `web-vitals` lib.

> Rule of thumb: **lab (dev) finds problems and catches regressions before deploy; field (post-deploy)
> confirms the fix for real users.** They differ 30-50% on interactivity — never treat a green
> Lighthouse as proof field INP is fine.

## PERF5. Asset & layout stability (weight: 12)

### PERF5a. Raw `<img>` instead of `next/image` — MEDIUM (LCP + CLS)
```
grep -rnE '<img\b' src app
```
`next/image` gives avif/webp, lazy-load, and reserved dimensions (prevents CLS). Above-the-fold hero
needs `preload` (`priority` is deprecated in Next 16) or `fetchPriority="high"`. Auto-fixable for simple cases under `--fix --assets`.

### PERF5b. Layout-shift sources (CLS) — MEDIUM
Images/embeds without width/height, content injected after load (banners/popups), a `fill` image
(legacy `layout="fill"`) without a positioned parent. `grep -rnP '<img\b(?![^>]*(width|height))' src app`.
Fix: reserve space. Report.

### PERF5c. Fonts not via `next/font` — LOW (CLS / FOUT)
```
grep -rnE '@font-face|fonts.googleapis.com' src app
```
Fix: `next/font` (self-hosted, swap, no layout shift). Report.

## PERF6. Streaming & rendering (weight: 8) — Next App Router; else N/A

### PERF6a. Slow async page with no Suspense — MEDIUM
A slow data section that blocks the whole route instead of streaming.
```
find app -name page.tsx | xargs grep -Ln 'Suspense'
```
Fix: wrap independent slow children in their own `<Suspense>`. Report.

### PERF6b. Un-awaited async params/searchParams — HIGH (Next 16 breaking change)
```
grep -rnE '(params|searchParams)\.[a-zA-Z]' app    # used without await/await-destructure
```
Fix: `const { id } = await params`. Guarded auto-fix; also a correctness bug.

---

## Cross-cutting: auth flash / FOEC (pointer — owned elsewhere)

Performance does NOT own loading-sequence flashes. But don't drop the thread silently: if you see the
auth-loading pattern (a data-fetching `useEffect`/page that can render before auth resolves), flag a
single pointer:
```
grep -rlnE 'useAuth|isAuthLoading|supabaseReady|useUser\(' src | xargs grep -ln 'useEffect' 2>/dev/null
```
Finding text: "Possible auth-driven FOEC / double-flash on <files> — run `audit-loading-animations`
(static FOEC) and `audit-console-logs` (live hydration) which own this." Note in the report; do not
score it here (it would double-count with those skills). CLS from the flash is already covered by PERF5b.

## Auto-fix summary
| Check | Auto-fix? |
|---|---|
| PERF5a `<img>`→`next/image` (simple) | Guarded |
| PERF6b await async params | Guarded |
| everything else | No / report |

Measurements are read-only — never edit code to "improve a number" automatically; report the number
and the suggested change.
