# setup-sentry — file templates (2026, @sentry/nextjs v10, Next.js 16)

Apply per the SKILL.md workflow. Preserve existing config; ask before overwriting. Never hardcode the
DSN/auth token. Adapt error-boundary styling to the project's design system.
Templates target `@sentry/nextjs` v10; the v11 differences are listed under "Upgrading to v11" in SKILL.md.

## instrumentation-client.ts  (NEW 2026 name — replaces `sentry.client.config.ts`)
Client/browser init + Session Replay live here only (Replay can't run in Node/Edge).
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  // Session Replay: 10% of sessions in prod, always on error (most debugging value)
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,                       // structured logs → Sentry; default on from 10.71.0, removed in v11
  debug: false,
  integrations: [
    Sentry.replayIntegration({ maskAllText: true, maskAllInputs: true, blockAllMedia: true }), // PII-safe
    Sentry.browserTracingIntegration(),
    Sentry.breadcrumbsIntegration({ console: false, dom: true, fetch: true, history: true }),
  ],
  ignoreErrors: ["ResizeObserver loop", "Non-Error promise rejection captured", /Loading chunk \d+ failed/],
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || "development",
});
// Required for client-side navigation instrumentation in the App Router:
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```

## sentry.server.config.ts
```ts
import * as Sentry from "@sentry/nextjs";
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  enableLogs: true,                       // default on from 10.71.0, removed in v11
  debug: false,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
});
```

## sentry.edge.config.ts
```ts
import * as Sentry from "@sentry/nextjs";
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
});
```

## instrumentation.ts  (root) — registers server/edge configs + the onRequestError hook
```ts
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge")  await import("./sentry.edge.config");
}

// 2026: captures errors from Server Components, middleware/proxy, and route handlers.
// Requires @sentry/nextjs >= 8.28. Do NOT add experimental.instrumentationHook (stable in Next 15; no flag needed).
export const onRequestError = Sentry.captureRequestError;
```

## next.config.ts — wrap with withSentryConfig
```ts
import { withSentryConfig } from "@sentry/nextjs";
const nextConfig = { /* existing config — preserve everything */ };

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,   // source-map upload during `npm run build`
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",                 // FIXED route, bypasses ad-blockers
  webpack: { automaticVercelMonitors: true }, // webpack only; _experimental.vercelCronsMonitoring covers both bundlers
});
```
**Next 16 + tunnel:** the network boundary file is `proxy.ts` (was `middleware.ts`). If your `proxy.ts`
matcher intercepts all requests, EXCLUDE the fixed tunnel route (`/monitoring`) from it — a random
`tunnelRoute: true` can't be excluded because it changes each build.
**Turbopack (Next 16 default):** instruments server functions/middleware automatically via Next
telemetry; source maps upload post-compile. Webpack-only options (`webpack.reactComponentAnnotation`,
`webpack.treeshake.removeDebugLogging`) apply only under `--webpack`. In v11 the top-level
`reactComponentAnnotation` option also covers Turbopack on Next 16+.

## app/global-error.tsx
```tsx
"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return (<html><body>
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Something went wrong</h1>
      <p>An unexpected error occurred. Our team has been notified.</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  </body></html>);
}
```

## app/error.tsx  (adapt styling to the project's design system — use shadcn Button/Card)
```tsx
"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground">An error occurred while loading this page.</p>
      <button onClick={() => reset()} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Try again</button>
    </div>
  );
}
```

## components/SentryUserContext.tsx  (Clerk — anonymous Sentry issues are useless for triage)
```tsx
"use client";
import * as Sentry from "@sentry/nextjs";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
export function SentryUserContext() {
  const { user, isLoaded } = useUser();
  useEffect(() => {
    if (!isLoaded) return;
    Sentry.setUser(user ? { id: user.id, email: user.primaryEmailAddress?.emailAddress, username: user.fullName || undefined } : null);
  }, [user, isLoaded]);
  return null;
}
```
Mount inside `<ClerkProvider>` in the root layout. Server side: in API routes/shared auth helper,
`const { userId, orgId } = await auth(); if (userId) Sentry.setUser({ id: userId }); if (orgId) Sentry.setTag("organization", orgId);`
(This project uses Supabase auth, not Clerk — set `Sentry.setUser({ id })` from the resolved Supabase user + `org_id` tag instead.)

## lib/sentry-tracking.ts  (helpers — single source of truth, never re-inline)
```ts
import * as Sentry from "@sentry/nextjs";
export function trackAction(action: string, data?: Record<string, string | number | boolean>) {
  Sentry.addBreadcrumb({ category: "user.action", message: action, data, level: "info" });
}
export async function trackWorkflow<T>(name: string, op: string, fn: () => Promise<T>): Promise<T> {
  return Sentry.startSpan({ name, op }, fn);
}
export function captureHandledError(error: unknown, context: Record<string, string>) {
  Sentry.withScope((scope) => { scope.setTags(context); scope.setLevel("warning"); Sentry.captureException(error); });
}
```

## Structured logging — Sentry.logger (new decision-point logs)
Requires logs enabled in every init file (client/server/edge): `enableLogs: true` below 10.71.0, default on
from 10.71.0. Attributes become queryable columns.
```ts
import * as Sentry from "@sentry/nextjs";
const { logger } = Sentry;

logger.info("order_created", { orderId: "ord_123", amount: 99.99 });
logger.warn("ai_escalated", { dealId, confidence: 0.42, reason: "booking_intent" });
logger.error("payment_failed", { orderId, reason: "card_declined" });

// Parameterised — template + values are stored separately so both are queryable:
logger.info(logger.fmt`${user.username} added ${product.name} to cart`, { cartId, userId: user.id });
```

## Forward existing console / a project logger.ts into Sentry (zero call-site changes)
Add to the integrations array in EACH init file. Forwards existing `console.warn`/`console.error` (and any
`lib/logger.ts` wrapper over them) as trace-connected Sentry logs. Skip `"log"`/`"info"` to avoid noise.
```ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enableLogs: true, // below 10.71.0 only; removed in v11
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
  ],
});
```
If the project already has a console-based `lib/logger.ts`, prefer this over rewriting every call site —
the existing `logger.warn(...)`/`logger.error(...)` calls flow straight into Sentry once enabled.

## Cross-runtime log attributes (Next client/server/edge)
Scopes don't propagate between runtimes. To stamp an attribute on logs everywhere, set it on the
**isolation** scope (not global — global leaks between concurrent requests) in each runtime's init:
```ts
Sentry.getIsolationScope().setAttribute("app.release", process.env.NEXT_PUBLIC_RELEASE ?? "dev");
```

## Server Action + multi-stage workflow spans
```ts
"use server";
import * as Sentry from "@sentry/nextjs";
export async function createProject(formData: FormData) {
  return Sentry.withServerActionInstrumentation("createProject", { recordResponse: true }, async () => {
    const titles = await Sentry.startSpan({ name: "generate-titles", op: "ai.pipeline" }, () => generateTitles(input));
    return await Sentry.startSpan({ name: "generate-article", op: "ai.pipeline" }, () => generateArticle(titles));
  });
}
```
Note: Server Actions are not auto-instrumented under Webpack or Turbopack; always wrap with
`withServerActionInstrumentation`. The explicit spans add per-stage timing.

## env + gitignore
`.env.local` (and `.env.example` without values): `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`,
`SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`. `.gitignore` must include `.env.local`, `.env.sentry-build-plugin`,
`.sentryclirc`.

## Priority actions to wire trackAction/trackWorkflow into
CRUD on primary entities · every form submit (success + failure) · wizard/step transitions · external
API calls (LLM/payment) · auth events (login/logout/org switch) · "Try again"/retry · file upload/export.
`dom: true` breadcrumbs already cover generic clicks — only add explicit `trackAction` for
business-critical actions.
