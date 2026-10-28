# Observability audit checks

Probe + fix catalogue for `audit-observability`. Each check: how to detect, severity, the fix, and
whether `--fix` may apply it automatically. Grounded in verified 2026 best practice (official
Next.js / Vercel / Supabase / Sentry docs).

Legend - Auto-fixable: **Yes** (`--fix` applies it) · **Guarded** (apply only after confirmation) ·
**No** (report only; dashboard/cost/data-egress sensitive).

---

## O1 - Instrumentation foundation (weight 20%)

| id | Check | How to detect | Severity | Fix | Auto |
|---|---|---|---|---|---|
| O1a | OTel instrumentation present | No `instrumentation.ts`/`.js` at repo root AND `@vercel/otel` not in `package.json` | HIGH | Add `instrumentation.ts` at root calling `registerOTel()` from `@vercel/otel` | Guarded |
| O1b | `instrumentation.ts` at project root | File exists but inside `app/` or `pages/` | HIGH | Move to repo root (sibling of `app/`) | Guarded |
| O1c | Dead `instrumentationHook` | Grep `experimental.*instrumentationHook` in `next.config.*` AND Next ≥15 | LOW | Remove the key - ignored on 15/16, clutters config | **Yes** |
| O1d | Missing hook on Next ≤14 | `instrumentation.ts` exists, Next ≤14, no `instrumentationHook: true` | MEDIUM | Add `experimental: { instrumentationHook: true }` | **Yes** |
| O1e | Node-only SDK without runtime guard | Grep for `NodeSDK`/`@opentelemetry/sdk-node` import NOT wrapped in `process.env.NEXT_RUNTIME === 'nodejs'` | HIGH | Guard the import, or switch to `@vercel/otel` (edge-compatible). Raw NodeSDK breaks the build when bundled for edge | Guarded |
| O1f | Manual SDK on Vercel disables native features | `@opentelemetry/sdk-node` used instead of `@vercel/otel` while deploying to Vercel | MEDIUM | Prefer `@vercel/otel` - manual config loses Session Tracing + Trace Drains | No |

## O2 - Error tracking (weight 20%)

| id | Check | How to detect | Severity | Fix | Auto |
|---|---|---|---|---|---|
| O2a | Error tracker installed | No `@sentry/nextjs` (or equivalent) in `package.json` | HIGH | `npx @sentry/wizard@latest -i nextjs` | Guarded |
| O2b | Per-runtime configs separated | Only one Sentry config, or browser+server share it. Expect `sentry.server.config`, `sentry.client/edge` (or `instrumentation-client.ts`) | HIGH | Split: Node server, browser, and Deno edge functions are different environments and need separate configs | Guarded |
| O2c | `onRequestError` wired | Next ≥15, no `onRequestError` export in `instrumentation.ts` | MEDIUM | Export `onRequestError` (Sentry's `captureRequestError`) to catch server render/route errors | Guarded |
| O2d | Source maps uploaded | Sentry present but no `withSentryConfig`/source-map upload in `next.config.*` | MEDIUM | Enable source-map upload so prod stack traces resolve | Guarded |
| O2e | DSN not hardcoded client-side | Grep a literal `https://*@*.ingest.*sentry.io` in client code | LOW | DSN in client is acceptable (public) but prefer env var | No |
| O2f | Supabase Edge Functions instrumented | `supabase/functions/` exist with no Sentry/error capture | MEDIUM | Add a separate Sentry (Deno) project for edge functions | No |

## O3 - Trace + log correlation (weight 20%)

| id | Check | How to detect | Severity | Fix | Auto |
|---|---|---|---|---|---|
| O3a | `trace_id` on structured logs | Logger helper exists but log records carry no `trace_id`/`traceId` from active span | HIGH | Attach `trace.getActiveSpan()?.spanContext().traceId` to each log record - the single highest-leverage correlation step | Guarded |
| O3b | Sentry ⨯ `@vercel/otel` double init | Both `@sentry/*` (SDK v8 or later; current major is v11, v10 still patched) AND `@vercel/otel` present, with no coexistence config | HIGH | Sentry auto-configures OpenTelemetry, which collides with `@vercel/otel`'s own setup and breaks trace propagation. Fix: set `skipOpenTelemetrySetup: true` in `Sentry.init()` to defer to Vercel's OTel, OR keep Sentry tracing by wiring `SentryContextManager` + `SentryPropagator` + `SentrySampler` around your own `NodeTracerProvider` (Sentry's custom-setup guide). On v11 the option is `enableOpenTelemetrySetup` (default true on Next; set false when running your own OTel) and `SentryContextManager`/`SentrySampler`/`SentrySpanProcessor` are removed in favour of `openTelemetryIntegration()` | No |
| O3c | Context propagation across boundary | Frontend telemetry exists but no `traceparent` propagation to backend | MEDIUM | Configure fetch instrumentation to inject `traceparent` (W3C Trace Context) for full-stack traces | No |
| O3d | Custom spans on edge runtime | Grep `startSpan`/`tracer.startActiveSpan` inside an edge-runtime file | LOW | Move to Node runtime - Vercel does not support custom spans from edge | No |

## O4 - Logs + drains (weight 15%)

| id | Check | How to detect | Severity | Fix | Auto |
|---|---|---|---|---|---|
| O4a | `console.log` as observability | Many `console.log` in `app/`, `src/`, `supabase/functions/` used for prod debugging | MEDIUM | Replace with a structured logger emitting JSON + level + `trace_id` | Guarded |
| O4b | Supabase Log Drain | Cannot verify from code (dashboard: Project Settings > Log Drains) | MEDIUM | Add a drain (OTLP / Sentry DSN / Loki / Datadog) so Postgres/Auth/Storage/edge logs join the app stack. Pro+ only | No (dashboard) |
| O4c | Vercel Drains | Cannot verify from code (dashboard: project > Drains) | LOW | Enable Vercel Drains (Pro and Enterprise) - stream Logs, Traces, Speed Insights, Web Analytics and Audit Log; log and trace records auto-include `traceId`/`spanId` | No (dashboard) |
| O4d | Log levels per environment | Grep loggers always at `debug`/`info` with no env gating | LOW | Gate verbosity by `NODE_ENV` | Guarded |

## O5 - Metrics + RUM (weight 15%)

| id | Check | How to detect | Severity | Fix | Auto |
|---|---|---|---|---|---|
| O5a | Core Web Vitals capture | No `web-vitals` usage and no Sentry browser-tracing / `useReportWebVitals` | MEDIUM | Capture CWV (LCP/INP/CLS) via Sentry browser SDK or `web-vitals` -> backend | Guarded |
| O5b | RED metrics available | No latency/error-rate/throughput per route (derivable from traces in Sentry/SigNoz, or explicit metrics) | MEDIUM | Ensure p50/p95/p99 + 5xx rate + RPS per route pattern exist | No |
| O5c | Alerts configured | Cannot verify from code (dashboard) | MEDIUM | Alert on error-rate spike + latency threshold + (optional) saturation | No (dashboard) |
| O5d | Frontend error capture | Browser runtime has no error/unhandled-rejection capture | MEDIUM | Sentry browser SDK (more production-ready than experimental browser OTel) | Guarded |

## O6 - Cost + PII hygiene (weight 10%)

| id | Check | How to detect | Severity | Fix | Auto |
|---|---|---|---|---|---|
| O6a | Trace sampling | Sampler at 100% / unset at volume (grep `tracesSampleRate: 1`, or no sampler env) | MEDIUM | ~10% head sampling for traces (`parentbased_traceidratio` 0.1), 100% for errors, 100% for CWV (tiny payloads) | No (cost) |
| O6b | PII scrubbing before send | No `beforeSend`/scrub for `token`/`password`/`email`/`card` in error/span data | HIGH | Scrub before transmission - strip sensitive query params, redact user IDs in URLs, sanitise fetch-body breadcrumbs. Sentry v11: spans are scrubbed in `beforeSendSpan` (`beforeSendTransaction` does nothing under span streaming) and collection is set by an explicit `dataCollection` baseline | Guarded |
| O6c | Over-instrumentation | Custom spans around sub-1ms ops, or every log line emitted as a span event | LOW | Remove - keep logs in the log system, correlate by `trace_id` instead of span events | Guarded |
| O6d | High-cardinality log labels | Drain/Loki labels include user id, full URL, request id | MEDIUM | Use low-cardinality labels (env, source, route pattern); put high-cardinality data in fields/structured metadata | No |
| O6e | Browser OTLP not proxied | Browser exporter points directly at an external collector | MEDIUM | Proxy via an edge function to scrub PII, handle CORS, rate-limit before backend | No |

---

## Severity guidance

- **CRITICAL**: telemetry actively broken or leaking PII at volume (e.g. unscrubbed prod errors with
  card data). Rare in static audit - usually surfaces as HIGH.
- **HIGH**: a core signal is missing or mis-wired (no error tracking, double OTel init breaking
  traces, no `trace_id` correlation, Node SDK that breaks edge builds).
- **MEDIUM**: a signal is present but incomplete (no drains, no CWV, no alerts, no sampling).
- **LOW**: hygiene/clarity (dead config keys, env-gating, DSN style).

## Verified-source basis (2026)

- Next.js OpenTelemetry guide - `@vercel/otel`, `instrumentation.ts` auto-loaded on 15/16,
  `NEXT_RUNTIME` guard, `NEXT_OTEL_VERBOSE`.
- Vercel Tracing docs (updated 2026-09-16) - `@vercel/otel` required for Session Tracing/Trace
  Drains; Sentry SDK v8+ ⨯ `@vercel/otel` conflict, resolved with `skipOpenTelemetrySetup: true`;
  no custom spans on edge. Still current for `@sentry/nextjs` v10 ⨯ `@vercel/otel` v2 (checked
  2026-08-21).
- Sentry v10-to-v11 migration guide (docs.sentry.io, checked 2026-10-21) - `skipOpenTelemetrySetup`
  is replaced by `enableOpenTelemetrySetup`; `openTelemetryIntegration()` replaces the custom OTel classes.
- Supabase Log Drains docs - OTLP/Sentry/Loki/Datadog/S3 destinations, Pro+ (GA Mar 2026).
- Sentry "Full-stack observability for Next.js + Supabase" - per-runtime projects, Supabase
  integration for query spans, log drain -> Sentry DSN.
- Independent 2026 guides (SigNoz, Uptrace, Elastic, CoderCops) - `trace_id` on every log, sampling
  ratios, PII scrubbing, browser OTel still experimental.
