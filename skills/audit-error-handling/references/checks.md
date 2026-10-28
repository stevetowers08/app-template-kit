# audit-error-handling — check catalogue

Static checks for error-handling robustness in a **Next.js 16 + React 19 + TypeScript + Supabase**
app. Folds the `error-handling-patterns` principles (exceptions vs Result types, recoverable vs
unrecoverable categories, retry/circuit-breaker, graceful degradation, surface-don't-swallow) into
concrete, auditable checks for this stack.

Core principle from those patterns: **recoverable** errors (network timeout, rate limit, invalid
input, missing row) get handled/retried/surfaced; **unrecoverable** ones (bugs) should fail loud, not
be swallowed. The worst anti-pattern is `try { … } catch { warn } continue` — it hides bugs for weeks.

---

## EH1. Swallowed / silent errors (weight: 25)

### EH1a. Empty or log-only catch that continues — HIGH
```
grep -rnzoE 'catch\s*\([^)]*\)\s*\{\s*\}' src app                      # empty catch
grep -rnE 'catch\s*\([^)]*\)\s*\{[^}]*(console\.(log|warn|error))[^}]*\}' src app  # log-and-continue
grep -rnE '\.catch\(\s*\(\)\s*=>\s*\{?\s*\}?\s*\)' src app             # .catch(() => {})
```
A catch that logs and proceeds as if nothing happened hides real failures. Fix: handle it
(recover/retry/surface) or rethrow + record. The scraper-pipeline lesson: `try → record event →
throw`, not `try → warn`. Report.

### EH1b. Error discarded from a Result/response — MEDIUM
Supabase returns `{ data, error }`; ignoring `error` and using `data` is a silent failure.
```
grep -rnE 'const\s*\{\s*data\s*\}\s*=\s*await .*\.(from|rpc|select|insert|update|delete)\(' src app
```
(`{ data }` destructured without `error`.) Fix: check `error` and handle. Report.

## EH2. React error boundaries (weight: 20)

### EH2a. Missing route-segment / global error boundary — HIGH
App Router: risky segments need `error.tsx`; the app needs a root `global-error.tsx`.
```
find app -name error.tsx; ls app/global-error.tsx 2>/dev/null || echo "no global-error.tsx"
```
Without them, an uncaught render error blanks the whole tree. Fix: add boundaries. Report.

### EH2b. Boundary doesn't report to the error tracker — MEDIUM
Project uses Sentry; `error.tsx`/`global-error.tsx` should `captureException` (or call the logger) in
a `useEffect`, not swallow silently.
```
grep -rLn "captureException\|Sentry\|logger" $(find app -name error.tsx -o -name global-error.tsx)
```
Fix: capture in the boundary. Report. (Cross-ref `audit-observability` for the tracker setup itself.)

## EH3. Async / promise safety (weight: 20)

### EH3a. Floating (unawaited) promise — HIGH
A promise neither awaited, returned, nor `void`-marked — its rejection is unhandled.
```
grep -rnE '^\s*[a-zA-Z_$][\w$.]*\([^)]*\)\s*;?\s*$' src app | # heuristic; confirm it returns a promise
```
Fix: `await`, `return`, or `void` (for intentional fire-and-forget) + a `.catch`. Report candidates.

### EH3b. `Promise.all` where partial failure should be tolerated — MEDIUM
`Promise.all` rejects on the first failure, dropping the successful results. For independent tasks
that should each be allowed to fail, use `Promise.allSettled`.
```
grep -rn 'Promise.all(' src app    # review: should any of these be allSettled?
```
Report candidates (judgement call).

## EH4. Error typing & propagation (weight: 15)

### EH4a. Catch variable used without narrowing — MEDIUM
With `useUnknownInCatchVariables`, `catch (e)` is `unknown`. Accessing `e.message`/`e.code` without
`instanceof Error` is unsafe (the thrown value may be a string).
```
grep -rnE 'catch\s*\([^)]*\)\s*\{[^}]*\b(err|error|e)\.(message|code|status|stack)' src app
```
(Overlaps `audit-typescript` TS3b — here it's the handling-correctness angle.) Fix: narrow first. Report.

### EH4b. Throwing a string / non-Error — LOW
```
grep -rnE 'throw\s+["\x27`]' src app    # throw 'something'
```
Throw `Error` (or a typed error class) so stack + `instanceof` work. Fix: wrap in `new Error(...)`.
Guarded auto-fix under `--fix --typing`.

## EH5. Resilience (weight: 10)

### EH5a. External/transient call with no retry or timeout — MEDIUM
Network/DB/3rd-party calls that can transiently fail with no retry-with-backoff or timeout.
```
grep -rnE 'await fetch\(|await .*\.(rpc|from)\(' src app | # cross-ref a retry/timeout wrapper
```
Recoverable errors deserve a bounded retry (with jitter) + timeout; persistent external deps benefit
from a circuit breaker. Report candidates (advisory — don't over-engineer internal calls).

### EH5b. No graceful-degradation fallback for a non-critical feature — LOW
A failing non-critical widget (recommendations, analytics) should degrade, not crash the page.
Manual review; report obvious cases. Advisory.

## EH6. User-facing error UX (weight: 10)

### EH6a. Mutation failure not surfaced to the user — MEDIUM
A failed save/delete that shows no toast/Notice leaves the user thinking it worked.
```
grep -rnE 'useMutation\(' src | xargs grep -Ln 'onError'    # mutations with no onError handler
```
Fix: add `onError` → toast/Notice. Report.

### EH6b. Raw `error.message` shown to the user — LOW
```
grep -rnE '(toast|Notice|alert)\([^)]*\b(err|error|e)\.message' src app
```
Leaks internals + poor UX. Fix: a friendly message; log the detail. Report. (HTTP-response leakage is
`audit-api` API4a; this is the UI angle.)

---

## Auto-fix summary
| Check | Auto-fix? |
|---|---|
| EH4b throw string → `new Error()` | Guarded |
| everything else | No / report |
Nothing that changes control flow (adding handlers, retries, boundaries) is auto-applied — those are
judgement calls.
