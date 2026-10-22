---
name: setup-sentry
description: Scaffold Sentry (@sentry/nextjs) error tracking with full observability in a Next.js app - error capture, API + workflow tracing, Session Replay (PII-masked), error boundaries, user context, structured logs, source maps, and production-tuned sample rates. Generator/scaffolder. Use when setting up or adding Sentry, wiring error tracking/observability, or adding tracing to a Next.js project. Pairs with /check-sentry (triage live errors) and /audit-observability (deep review).
disable-model-invocation: true
argument-hint: ""
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
last_verified: 2026-10-21
---

# setup-sentry

Scaffold Sentry in a Next.js app with **full observability** - not just error capture, but tracing API
calls, user actions, and workflow stages, with PII-safe Session Replay and readable stack traces.
Follow the steps in order; **ask before overwriting** any existing Sentry config. All file contents are
in `references/templates.md` (2026, `@sentry/nextjs` v10, Next.js 16).

> When to use: "set up Sentry", "add error tracking / observability", "wire Sentry tracing". The
> `setup-` (scaffold) tier. Pairs with `/check-sentry` (quick triage of live errors) and
> `/audit-observability` (deep scored review). Ask for the Sentry org, project and region
> rather than assuming them.

## 2026 deltas (what changed - apply these)

- Client config file is **`instrumentation-client.ts`** (was `sentry.client.config.ts`); Session Replay
  lives there only, with `onRouterTransitionStart` exported for App-Router nav instrumentation.
- `instrumentation.ts` exports **`onRequestError = Sentry.captureRequestError`** (Server Components /
  middleware / route handlers). Never add `experimental.instrumentationHook` (stable in Next 15; no flag needed).
- **Next 16:** the tunnel route must be excluded from **`proxy.ts`** (not `middleware.ts`); use a FIXED
  `tunnelRoute`. **Turbopack** (default) auto-instruments via telemetry.
- **`enableLogs`** (Structured Logs went GA 2025-09-03) defaults on from 10.71.0; set `enableLogs: true`
  only below that version. It is removed in v11. Add **Replay PII masking**
  (`maskAllText`/`maskAllInputs`/`blockAllMedia`). Logs are a first-class signal now, not just errors.

## Procedure

1. **Detect state.** Framework (Next?), App vs Pages Router, auth provider (Supabase here), existing
   `@sentry/*` + config files, error pages. If Sentry already exists, report what's there and ask what
   to update - don't clobber.
2. **Install.** `npm install @sentry/nextjs@10` (the templates target v10; v11 deltas are under
   "Upgrading to v11").
3. **Create config files** from `references/templates.md`: `instrumentation-client.ts`,
   `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts` (with `onRequestError`).
4. **Wrap `next.config.ts`** with `withSentryConfig` (org/project/authToken, fixed `tunnelRoute`,
   `webpack.automaticVercelMonitors`). Preserve all existing options - only wrap the export. Add the proxy.ts
   tunnel-exclusion + Turbopack notes.
5. **Env + gitignore.** Add the 4 Sentry env vars to `.env.local` + `.env.example` (no real values);
   ensure `.gitignore` covers `.env.local`, `.env.sentry-build-plugin`, `.sentryclirc`.
6. **Error boundaries.** `app/global-error.tsx` + `app/error.tsx` (capture + friendly UI; style to the
   design system). Add `app/not-found.tsx` if missing.
7. **User context.** Attach `Sentry.setUser({ id })` + an `org_id` tag. Clerk → `SentryUserContext.tsx`
   in the layout; **Supabase (this project)** → set it from the resolved user in the server auth helper.
   Anonymous Sentry issues are useless for triage.
8. **Tracking helpers.** Create `lib/sentry-tracking.ts` (`trackAction`/`trackWorkflow`/
   `captureHandledError`) - single source of truth. Wire into the priority actions (CRUD, form submits,
   wizard steps, external API calls, auth events, retries, file ops). `dom:true` breadcrumbs cover
   generic clicks already.
8b. **Structured logging (the 4th signal).** Errors fire on exceptions; **logs are the deliberate
   breadcrumbs at decision points** ("why did it do that"). Two paths, use both:
   - **`Sentry.logger.info/warn/error(msg, { attrs })`** for new decision-point logging - attributes
     become queryable columns (`logger.warn("ai_escalated", { dealId, confidence })`). Use `logger.fmt`
     for parameterised messages.
   - **`consoleLoggingIntegration({ levels: ["warn","error"] })`** to forward EXISTING `console.warn`/
     `console.error` (or a project `logger.ts` wrapper over them) into Sentry with zero call-site
     changes. Skip `"log"`/`"info"` to avoid noise. If the project already has a console-based
     `lib/logger.ts`, this integration is the cheapest way to make every existing call trace-connected -
     don't rewrite the call sites.
   Cross-runtime gotcha: scopes don't propagate across Next's client/server/edge runtimes; for
   attributes on all logs call `getIsolationScope().setAttribute()` per runtime (isolation scope, not
   global - global leaks between concurrent requests).
9. **API + workflow + Server Action spans.** Wrap multi-stage routes/actions with
   `withServerActionInstrumentation` + per-stage `startSpan({ op: "ai.pipeline" })`.
10. **Verify source maps.** `npm run build` and confirm upload (needs a valid `SENTRY_AUTH_TOKEN` + org/
    project). Source maps only upload on the **production build**.
11. **Summary** - list files created, user-context mode, tracked actions, sample rates, and next steps
    (real env values, Vercel env, deploy + verify events, tune sample rates).

## Rules

- **Never overwrite existing Sentry config without asking.** Preserve all `next.config` options.
- **Never hardcode** the DSN or auth token in source.
- **Never `tracesSampleRate: 1.0` in production** - it blows quota (1.0 dev / ~0.2 prod).
- Replay must be **PII-masked**; keep `replaysOnErrorSampleRate: 1.0` (error sessions debug best).
- Error boundaries match the project's design system.
- If an auth provider is present, ALWAYS set user context.
- Keep the tracking helpers in `lib/sentry-tracking.ts` - never re-inline the same logic per component.
- **Don't add a second logging vendor by default.** Sentry logs are trace-connected to the errors/
  replays you already look at - that correlation is the whole point. Only add a dedicated log store for
  high-volume archival/compliance.

## Upgrading to v11

The templates and install command target v10 (v10 is still patched). `@sentry/nextjs` v11 (released
2026-09-23) is the current major, and `npx @sentry/wizard@latest -i nextjs` (wizard 8) installs `^11`.
Apply these deltas when a repo is on v11 (source: docs.sentry.io v10-to-v11 migration guide, checked 2026-10-21):

- **Import:** `withSentryConfig` comes from `@sentry/nextjs/config` (entry point present since 10.73.0).
- **Logs:** `enableLogs` is removed. Logs default on; nothing is sent until `Sentry.logger` or a logging
  integration is used.
- **Vercel monitors:** top-level `automaticVercelMonitors` is removed. Use `webpack.automaticVercelMonitors`
  (webpack only) or `_experimental.vercelCronsMonitoring` (both bundlers).
- **Breadcrumbs:** `breadcrumbsIntegration` has no `console` option; `consoleIntegration` handles console
  breadcrumbs.
- **Data collection:** `sendDefaultPii` is replaced by `dataCollection`. v11 collects everything by default
  (`userInfo`, `cookies`, `httpHeaders`, `httpBodies`, `urlQueryParams`, `genAI`, `databaseQueryData`,
  `stackFrameVariables`, `frameContextLines`, `graphQL`), so set an explicit `dataCollection` baseline in
  every init file.
- **Spans:** span streaming is the default, so `beforeSendTransaction` and `ignoreTransactions` do nothing.
  Use `beforeSendSpan` and `ignoreSpans`; `traceLifecycle: "static"` keeps the transaction model.
- **OpenTelemetry:** `skipOpenTelemetrySetup` is replaced by `enableOpenTelemetrySetup` (default true on
  Next; set false when running your own OTel). `SentryContextManager`, `SentrySampler` and
  `SentrySpanProcessor` are removed; use `openTelemetryIntegration()`.
- **Component annotation:** v11's top-level `reactComponentAnnotation` covers Turbopack on Next 16+; v10
  has `webpack.reactComponentAnnotation` (webpack only).

## Logging strategy + free tiers (verified 2026-06)

Default: **log into Sentry** via `Sentry.logger`/`consoleLoggingIntegration` (plus `enableLogs` below 10.71.0). For a
low/medium-traffic app the free allowance covers it with room to spare.

| Tool | Free logs | Retention | Use |
|---|---|---|---|
| **Sentry** | 5 GB/mo; the free Developer plan cannot set pay-as-you-go, so overage is dropped | 30 days | **Default** - trace-connected, already installed |
| Axiom Personal | 500 GB/mo ingest | 30 days | Best free *bulk* store if archival/high-volume is needed |
| Better Stack free | ~3 GB/mo | **3 days** | Too short for logs |
| Vercel Hobby runtime logs | console output | **1 hour** | Not a store; drains need Pro |
| Supabase Free | built-in viewer | **1 day** | Ad-hoc DB debugging only |

**Log drains cost money - not a free path.** Forwarding Supabase or Vercel platform logs into Sentry
requires each platform's **Pro plan** (Supabase log drains are ~$60/drain/mo; Vercel drains need Pro or Enterprise).
On free tiers, log from app code via the SDK instead of draining.

## See also
- `references/templates.md` - all file contents (load when scaffolding)
- `/check-sentry` - triage live errors (the check tier)
- `/audit-observability` - deep scored review of the whole observability setup
