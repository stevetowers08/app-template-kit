---
name: audit-console-logs
description: Visit EVERY page in the running app with a real browser and report what shows up in the console and at runtime - console logs/warnings/errors, uncaught JS exceptions, React hydration mismatches, failed network requests (4xx/5xx), and dead interactivity after hydration. This is a LIVE walk-through of every page (needs the app running), not a static scan. Reports a scored summary with a per-page table. Use when asked to check every page, find console logs/errors, smoke-test the app, or check for hydration/runtime issues.
disable-model-invocation: true
argument-hint: "[--prod] [--routes=/a,/b]"
allowed-tools: Read, Grep, Glob, Bash
last_verified: 2026-08-21
---

# audit-console-logs

Open the **running** app in a real browser and walk **every page**, collecting what only appears at
runtime: console logs/warnings/errors, uncaught exceptions, hydration mismatches, failed network
requests, and dead interactions. Report a **scored** summary plus a **per-page table** so you can see
exactly which page produced which message. This is the only audit skill that is **live, not static**,
and it is **read-only** (it observes; it never edits code).

> When to use: "check every page for console errors", "any console logs left", "smoke-test the app",
> "check for hydration issues", "does every page run clean". Mirrors the `audit-database` report shape
> for `/full-audit`. Keep the template stable. Reports per-page findings; the *fixes* belong to
> `audit-performance` / `audit-production-readiness` / `audit-error-handling` once a page is implicated.

## Modes

| Invocation | Behaviour |
|---|---|
| `/audit-console-logs` (default) | Launch dev server (reuse if up), walk **every** page, report. |
| `/audit-console-logs --prod` | Test a production build (`npm run build && npm start`) — catches optimisation-only bugs. Note which build was used. |
| `/audit-console-logs --routes=/a,/b` | Limit to the given pages (otherwise every page is visited). |

No `--fix`: this skill observes; it never edits code.

## Procedure

1. **Check the app can run.** If the dev/preview server can't start, or Playwright/Chromium isn't
   available, return `Score: N/A — app not running` and list skipped pages. **Never fabricate runtime
   results.**
2. **Enumerate EVERY route — no sampling.** Crawl `app/` for every `page.tsx` and map to its URL.
   Visit every static route; visit one representative instance per dynamic-route template (a real id
   from the seed/DB or the first row of the list page); sign in once (`storageState`) to cover
   auth-gated pages too. Only cap for very large apps (>~80 routes), and `log` exactly which pages
   were not reached — never silently drop a page.
3. **Drive each page** per `references/checks.md`: attach `console`/`pageerror`/`response` listeners
   BEFORE `goto`, navigate with relative paths + `baseURL`, wait for hydration (interact once), and
   collect console **errors and warnings** (a stray `console.log` surfaces here), uncaught exceptions,
   and ≥400 responses. Seed returning-user `localStorage` via `addInitScript` for hydration edge cases.
4. **Score** each dimension; compute the overall grade.
5. **Output the report** (template below) with the per-page table.

## Scoring

Start each dimension at 100; subtract per finding (CRITICAL -40, HIGH -20, MEDIUM -10, LOW -3,
floor 0). Overall = weighted mean. If the app couldn't run, overall = `N/A` (excluded from
`/full-audit` aggregation).

| Dim | Weight | Covers |
|---|---|---|
| CL1 Uncaught exceptions | 30 | `pageerror` / unhandled rejection on any page |
| CL2 Hydration mismatches | 25 | console hydration-pattern errors |
| CL3 Console logs & errors | 20 | other `console.error` + stray `console.log`/`console.warn` |
| CL4 Failed network requests | 15 | responses ≥400 during load (asset 404, API 500, Flight) |
| CL5 Interactivity after hydration | 10 | a client control that does nothing after load |

Grade: A ≥90, B ≥80, C ≥70, D ≥60, F <60.

## Report template (keep stable - the audit pipeline parses this)

```
# Console Logs Audit - <project> - <grade> (<overall>/100)

Build tested: dev | production    Pages walked: <n> of <total> (<n skipped>)

| Dimension | Score | Findings |
|---|---|---|
| CL1 Uncaught exceptions           | NN | n |
| CL2 Hydration mismatches          | NN | n |
| CL3 Console logs & errors         | NN | n |
| CL4 Failed network requests       | NN | n |
| CL5 Interactivity after hydration | NN | n |

## Per-page results (every page, so coverage is visible)
| Page | Errors | Warnings | Failed reqs | Notes |
|---|---|---|---|---|
| /                  | 0 | 0 | 0 | clean |
| /dashboard         | 1 | 2 | 0 | hydration mismatch on date |
| /deals/[id] (id=42)| 0 | 0 | 1 | 500 on /api/x |
| ...                |   |   |   | (one row PER page) |

## Findings
### [SEVERITY] <id> <title>   (check CL2)
- Page: </path>
- Evidence: <console text | status code | stack>
- Likely owner: <audit-performance | audit-production-readiness | audit-error-handling>

## Skipped
- <pages not reached, and why (app down / no dynamic instance)>
```

## Rules

- **Live, read-only, no fabrication.** If it didn't run, it's `N/A`/`SKIPPED` — never a guessed score.
- **Every page gets a row** in the per-page table — that visibility is the point of the skill; never
  hide pages inside an aggregate.
- Follow the anti-patterns table in `references/checks.md` (no `waitForTimeout`, no hardcoded
  localhost, don't mock your own routes) — they produce false results.
- Prefer testing a **production build** for hydration/caching bugs; always state which build was used.
- Don't edit code — point each finding at the static skill that owns the fix.

## See also
- `references/checks.md` - run procedure + per-dimension detail
- Sibling: `audit-tests` (static test-suite audit) — this is the live, every-page complement
- Static console.log counterpart: `audit-production-readiness` PROD2b (greps for left-in `console.log`)
