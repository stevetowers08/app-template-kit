---
name: check-testing
description: Run a full functional QA pass on the app - static analysis (tsc, eslint, build), unit/integration tests, E2E, manual route/API/form flow verification, edge-case & resilience analysis, and a dependency check - then report broken flows vs degraded UX vs minor issues against a pre-ship checklist. Answers "does this app actually work for users right now". Report-only; fixes nothing. Use when the user wants a QA pass, to run the full test suite + functional review, a pre-ship check, or to verify the app works end to end.
disable-model-invocation: true
argument-hint: ""
allowed-tools: Bash, Read, Write, Glob, Grep, Task
last_verified: 2026-10-21
---

# check-testing

Run a comprehensive functional QA pass and report whether the app works for users **right now**.
**Report only - fix nothing** until the user reviews. The `check-` (operational pass) tier; it completes
the triad **`setup-testing` (scaffold) → `check-testing` (run the pass) → `audit-tests` (score the suite
quality)**.

> When to use: "run a QA pass", "does it all work", "pre-ship check", "run the full test suite +
> review". Distinct from `audit-tests` (which statically *reviews the suite* - coverage, pyramid,
> mocks) - this one *executes* and checks real behaviour.

## Procedure

1. **Read `TESTING.md`** if present (the project's feature/route/edge checklist). If absent, note it and
   recommend `/setup-testing`.
2. **Static analysis** - `npx tsc --noEmit`, `npx eslint .`, `npm run build`. Record
   errors/warnings with file:line, build pass/fail.
3. **Unit/integration** - `npm run test` (+ `test:coverage`). Per failure: what user-facing behaviour is
   broken, and is it a real bug or a flaky/outdated test?
4. **E2E** - `npm run test:e2e`. Per failure: which user flow broke; reproduces consistently? Check
   `test-results/` screenshots/traces. No E2E → note as a gap.
5. **Flow verification** (read code, never modify) - for every page: render / data deps / loading /
   error / empty / unauth handling; every API route: valid response + status, 400 not 500 on bad input,
   401 unauth, Zod validation, null-safety; every form/button: validation, error messages, disable-on-
   submit, destructive-confirm, success feedback, cancel resets. (Optional: run 5a/5b/5c as parallel
   read-only subagents for speed - skip if you'd rather do it inline.)
6. **Edge cases & resilience** (error paths over happy paths) - per route/handler: empty (`[]`/null),
   loading, error (network/500), timeout, malformed response, input validation (empty/long/unicode),
   auth edges (expired/role mismatch), races (double-click/rapid-nav), null/undefined, back-forward +
   refresh + deep-link, mobile viewport, stale data after mutation, and (if present) pipeline-stage +
   circuit-breaker failure paths.
7. **Dependencies** - `npm audit`, `npm outdated`. Record critical/high vulns + severely-outdated deps.
8. **Report** (template below) to a scratch file + summarise; update `TESTING.md` Status columns if it
   exists.

## Report template (keep stable)
```
# QA Report - <project> - PASS | FAIL

| Category | Status | Issues |
| TypeScript / ESLint / Build / Unit / E2E / Pages / API / Forms / Edge cases / Deps | … |

## Broken user flows (fix before shipping)   [BROKEN] <what breaks for the user> - file:line
## Degraded experience (should fix)           [EDGE/UX/FORM] … - file:line
## Minor issues                               [CONSOLE/TODO/DEPS] … - file:line
## Pre-ship checklist  (tsc · eslint · build · unit · e2e · loading/error/empty per page · form
   validation · destructive confirm · no debug console.log · async error states · no critical vulns)
```

## Rules

- **Report only** - frame issues by what breaks *for the user*, with file:line. Separate **broken flows**
  (block shipping) from **degraded UX** (should fix) from **minor**.
- **Error paths over happy paths** - a page that renders with good data is expected; one that blanks or
  crashes on bad data is the bug.
- **No false positives** - a logger using `console.log` is fine; test files may have debug; ignore
  Clerk/React-dev-mode/Sentry noise.
- **Stay in lane** - no security or accessibility audit here (those are `audit-security` /
  `audit-design-system` + `audit-console-logs`); no snapshot-test or library-internal recommendations.

## See also
- `/setup-testing` (scaffold the suite) · `/audit-tests` (score the suite quality) - the other two of the triad
- `/audit-console-logs` - the live every-page console/runtime pass
