---
name: setup-error-handling
description: Scaffold a lean, production-grade error-handling layer in a Next.js (App Router) + React 19 + TypeScript + Zod + TanStack Query app - route + component error boundaries (error.tsx/global-error.tsx + catchError), a single AppError class with a centralized API error handler, Zod validation at trust boundaries, a fetch wrapper with timeouts + transient-only retry/backoff, TanStack Query retry tuning, and Sentry capture wiring. Generator/scaffolder. Use this whenever the user wants to add or set up error handling, error boundaries, API error responses, input validation, retry/timeout logic, or "make the app fail gracefully / not crash" - even if they don't say the exact words. Pairs with /setup-sentry (observability) and /audit-error-handling (review).
disable-model-invocation: true
argument-hint: ""
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
last_verified: 2026-10-21
---

# setup-error-handling

Scaffold the error-handling layer for a Next.js App Router app: boundaries so one broken component never
takes down the page, a single consistent shape for API errors, validation at the edges, and resilient
external calls. The goal is **comprehensive but lean** - cover the real failure modes without dragging in
a Result-monad cult or per-route boilerplate. All file contents live in `references/templates.md`
(verified 2026: Next 15-16, React 19, Zod 4, TanStack Query 5, `@sentry/nextjs` v10).

> When to use: "add error handling", "set up error boundaries", "make the app not crash", "handle API
> errors", "add input validation / retries / timeouts", "stop leaking stack traces". The `setup-`
> (scaffold) tier. Pairs with `/setup-sentry` (the observability net) and `/audit-error-handling` (the
> scored review). Reuse the house rules at `~/.claude/templates/project-rules/error-handling.md`.

## The two-axis model (what you're building)

1. **Expected vs unexpected.** Expected errors (validation failed, not found, rate limited) are *return
   values or typed throws with a status* - the user gets a clean message. Unexpected errors (null deref,
   third-party blew up) are *thrown* and caught by a boundary + reported to Sentry. Don't blur these.
2. **Gates vs nets.** Validation + timeouts are gates (stop bad input). Boundaries + the centralized
   handler are nets (contain what slips through). You need both.

## 2026 deltas (what changed - apply these)

- **Version gate - Next 16.3+:** `retry` and `catchError` are stable. Next 16.2 exposes them as
  `unstable_retry` / `unstable_catchError`.
- **`catchError` (from `next/error`)** is the framework-aware component-level boundary, stable on
  **Next 16.3+**. It lets `notFound()`/`redirect()`/`unauthorized()`
  propagate (react-error-boundary wrongly swallows them) and its `retry()` **re-fetches Server Component
  data** (a plain reset doesn't). Use it for component-level boundaries on 16.3+.
- **`error.tsx` / `global-error.tsx`** receive a **`retry`** callback on 16.3+ that re-fetches
  the segment on the server - this replaces the old `router.refresh()` + boundary-`key` reset hack. The
  `error` prop is typed `unknown`; narrow it before reading `digest` (`errorDigest` in `lib/errors.ts`).
- **`unstable_rethrow` (from `next/navigation`)** - call it first in any `try/catch` that wraps a server
  call, so framework control-flow throws aren't swallowed by your catch.
- **`react-error-boundary` is now niche** - only for *pure client-component* trees (no Server Components,
  no framework throws underneath), or as the fallback on Next < 16.2.
- **`AbortSignal.timeout(ms)`** (built-in) is the timeout mechanism - don't hand-roll
  `AbortController` + `setTimeout`.
- **Zod 4**: read issues from **`error.issues`** (map `issue.path.map(String).join('.')` to field names;
  `issue.path` is `PropertyKey[]`, so a bare `.join('.')` throws on symbol keys).

## Procedure

1. **Detect state.** Read `package.json` for Next version (≥16.3 enables stable `catchError`/`retry`; 16.2 has the `unstable_` forms),
   React, Zod, `@tanstack/react-query`, `@sentry/nextjs`, and the auth provider (**Clerk vs Supabase** -
   they differ only in how user context is read, which `/setup-sentry` owns). App vs Pages Router. Note
   what already exists: `app/error.tsx`, `app/global-error.tsx`, any `lib/errors*`, fetch wrappers, a
   `QueryClient`. **If a file exists, report it and ask before overwriting - never clobber.**
2. **Pick the boundary strategy** from the detected Next version (see the 2026 deltas). Tell the user
   which variant you'll scaffold and why.
3. **Core lib (the spine).** From `references/templates.md`, create:
   - `lib/errors.ts` - the single `AppError` class (carries `code` + `httpStatus` + optional `details`), small factory helpers (`BadRequest`, `Unauthorized`, `Forbidden`, `NotFoundError`, `Conflict`, `TooManyRequests`) and `errorDigest(error: unknown)` (narrows a boundary's `unknown` error before reading `digest`).
   - `lib/api/handler.ts` - `toErrorResponse(err)` (maps `ZodError`→422 with field details, `AppError`→its status, everything else→generic 500) and `withApiHandler(fn)` so route handlers carry **zero** try/catch boilerplate. Reports only 5xx/unexpected to Sentry - never double-reports expected 4xx.
   - `lib/validation.ts` - `parseOrThrow` (throw → handler maps to 422) and `safeParseFields` (return field errors for forms/Server Actions).
   - `lib/fetch.ts` - `fetchWithRetry`: `AbortSignal.timeout`, retry **only** 429 + 502/503/504 + network errors, exponential backoff **with jitter**, cap 30s, honour `Retry-After`. Never retries other 4xx or 500. POST guidance: only retry with an `Idempotency-Key`.
4. **Boundaries (the nets).** Create `app/error.tsx` and `app/global-error.tsx` (own `<html>/<body>`),
   both capturing to Sentry and styled to the design system, using `retry` on 16.3+ (16.2 exposes
   `unstable_retry`; earlier versions provide `reset`). Add `components/ErrorBoundary.tsx` for
   component-level use: `catchError` on 16.3+ (`unstable_catchError` on 16.2), otherwise
   a `react-error-boundary` variant flagged "client trees only". Add `app/not-found.tsx` if missing.
5. **TanStack Query tuning.** In the project's `QueryClient` (or create `lib/query-client.ts`): narrow
   `queries.retry` to a **transient-only** predicate (retry network/429/5xx, never 4xx), keep the
   built-in backoff, and set `mutations.retry: 0` (mutations are usually non-idempotent).
6. **Wire the entry points.** Convert a couple of representative route handlers to `withApiHandler` +
   `parseOrThrow` so the pattern is seeded (don't sweep the whole codebase - leave a TODO list). Point
   external API calls at `fetchWithRetry`. Show one Server Action using `safeParseFields` +
   `useActionState` for expected errors, and one `try/catch` using `unstable_rethrow`.
7. **Project rules.** If `~/.claude/templates/project-rules/error-handling.md` isn't already reflected in
   the repo's `AGENTS.md`/`CLAUDE.md` rules, add a short "Error handling" section pointing at the new
   `lib/` helpers so future code follows the same shape.
8. **Verify.** `npx tsc --noEmit` (and lint if configured) to confirm the scaffold type-checks. Note that
   `catchError`/`retry` are stable on Next 16.3+ (16.2 has only the `unstable_` forms) - if tsc complains, the version gate was wrong.
9. **Summary.** List files created, the boundary variant chosen (+ why), which routes were converted vs
   left as TODO, and next steps (sweep remaining routes, point all external calls at `fetchWithRetry`,
   confirm Sentry is set up via `/setup-sentry`).

## Rules

- **Never overwrite an existing file without asking.** Preserve project conventions and design-system styling in the boundary UIs.
- **One source of truth.** `AppError` + `withApiHandler` live once in `lib/` - routes never format errors or set status codes by hand. That consistency is the whole point.
- **Fail-safe, not fail-open.** On auth/permission ambiguity, default to **deny**. A broken check must never grant access or upgrade a plan.
- **Never swallow.** No empty `catch {}`. Log with context (IDs, what was attempted), then re-throw or handle. In server `try/catch`, call `unstable_rethrow(err)` first.
- **Never leak internals.** Users get friendly messages; stack traces/SQL/error details go to Sentry, not the response body or the UI.
- **Friendly UI always; correlate via digest - don't render raw errors.** Next.js already shows full errors in dev (overlay + terminal) and strips Server Component messages to an opaque `digest` in prod. So don't NODE_ENV-gate a stack trace into the boundary UI (redundant in dev, and for *client* errors `error.message` is real even in prod = an info-disclosure risk). Instead, always render the friendly fallback and **forward the digest to Sentry** (`captureException(error, { tags: { digest: errorDigest(error) } })`) so the client fallback maps to the exact server issue. Capturing the raw server error before Next strips it is `onRequestError`'s job - that lives in `/setup-sentry`. (An optional dev-only `<pre>{error.stack}</pre>` is a minor convenience, not the recommended lever.)
- **Keep `console.warn`/`console.error` in dev - it's how you and AI agents see failures.** Claude Code reads terminal output and the browser console (`preview_logs`/`preview_console_logs`) to diagnose, so don't silence meaningful console errors. In production, forward them to Sentry via `consoleLoggingIntegration({ levels: ["warn","error"] })` (owned by `/setup-sentry`) rather than adding logging here. Never ship `console.log` to prod, and never log secrets/PII.
- **Retry only transient, idempotent work.** 429 + 5xx + network. Never retry 4xx (except 429) or non-idempotent POSTs without an idempotency key. Always jitter + cap.
- **Don't double-report.** Expected `AppError`s (4xx) are not Sentry exceptions; only 5xx/unexpected are.

## Avoid (over-engineering - explicitly out of scope)

- A `Result`/`Either` monad threaded through every function. Throw for unexpected, return for expected - that's enough in TS/React.
- Per-route bespoke error formatting (the centralized handler exists so you don't).
- Retrying everything, or building a generic retry framework. The small `fetchWithRetry` covers it.
- Manual `digest` detection + `router.refresh()` + key-reset hacks - `catchError`/`retry` replace all of it.
- `react-error-boundary` as the default in the App Router - it mis-handles Server Components and framework throws.
- RFC 9457 Problem Details everywhere - the simple `{ error, code, details? }` shape is plenty for these apps (mention 9457 only if the user is building a public API for third parties).

## See also
- `references/templates.md` - all file contents (load when scaffolding)
- `~/.claude/templates/project-rules/error-handling.md` - the house rules this skill encodes
- `/setup-sentry` - the observability net (capture/trace) these boundaries report into
- `/audit-error-handling` - scored review of an existing error-handling setup
