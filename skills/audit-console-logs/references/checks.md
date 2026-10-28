# audit-console-logs — check catalogue

**Live** checks: drive the running app with Playwright and collect what only shows up at runtime.
Unlike the other audit skills, this one is NOT static grep — it needs the app running. Verified
against the Playwright Next.js testing guidance and 2026 hydration-detection patterns.

This skill REQUIRES a running app. Detect/launch the dev or preview server (`npm run dev`, reuse if
already up) and drive **every page in the app**. If the app cannot be started or Playwright/Chromium
is unavailable, return `Score: N/A — app not running` and list what was skipped. Never fabricate
runtime results.

Test **production builds** where possible (`npm run build && npm start`) — optimisation-related bugs
(hydration, caching) only appear there. Note in the report which build was tested.

---

## How to run

1. **Enumerate EVERY route — no sampling.** Crawl `app/` for every `page.tsx`/`page.ts` and map each
   to its URL path (strip route groups `(...)`, keep real segments). This is the whole point of the
   skill: visit every page, not a sample.
   - **Static routes** (`/dashboard`, `/settings/billing`): visit as-is.
   - **Dynamic routes** (`[id]`, `[slug]`, `[...catchall]`): visit ONE representative instance per
     template, using a real id from the seed/DB or the first row of the relevant list page. Note in
     the report that dynamic routes are sampled-by-template (one real instance each), and which id was
     used. If no real id can be obtained, mark that template `SKIPPED (no instance)`.
   - Auth-gated routes: sign in once, reuse `storageState`, then visit the protected pages too.
   - Only cap as a safety valve for very large apps (>~80 distinct routes): batch them, and `log`
     exactly which were not reached — never silently drop pages.
2. Launch the server (reuse existing). Use `baseURL` + relative `page.goto('/path')` — never a
   hardcoded `localhost:port`. Run pages in batches (Playwright workers) to keep it fast.
3. For **each** page, attach listeners BEFORE `goto`, navigate, wait for hydration (interact with one
   element), and collect:
   - `page.on('console', m => ['error','warning'].includes(m.type()))` — console **errors and
     warnings** (a stray `console.log`/`console.warn` left in code surfaces here; the static counterpart
     is `audit-production-readiness` PROD2b)
   - `page.on('pageerror', …)` — uncaught JS exceptions + unhandled rejections
   - `page.on('response', r => r.status()>=400)` — failed network requests
4. Classify console output: **hydration** (text includes `Hydration`/`hydration`/`did not match`/
   `server-rendered`) vs other errors vs warnings.
5. Build a **per-page table** (route → errors / warnings / failed requests) so coverage is visible and
   no page is hidden in an aggregate.

---

## CL1. Uncaught exceptions (weight: 30)
Any `pageerror` on a route = HIGH (a thrown error reached the browser). Report route + message + stack.
Negative-path coverage: use `page.addInitScript()` to seed `localStorage` (returning-user state) —
returning users with non-default settings trigger most mismatches.

## CL2. Hydration mismatches (weight: 25)
Console errors matching the hydration patterns = HIGH. These "still work" after client re-render so
they slip past normal E2E — that's why we assert the console is clean. Common cause: Date/timezone,
theme/locale read at render, non-serializable props (cross-ref `audit-production-readiness` PROD3c). Report
route + the mismatch text.

## CL3. Console errors (non-hydration) (weight: 20)
Other `console.error` output = MEDIUM. Real bugs (failed effects, prop-type violations, third-party
failures). Report route + message. (Console *warnings* are LOW/advisory.)

## CL4. Failed network requests (weight: 15)
Any response with status ≥400 during a route load = MEDIUM (404 asset, 500 API, failed RSC Flight
request). Report route + URL + status. Exclude expected/handled 401 auth redirects if the app handles
them gracefully (note the distinction).

## CL5. Interactivity after hydration (weight: 10)
A client component whose handler does nothing after load = hydration failed silently. Spot-check one
interactive control per key route (e.g. a button increments, a menu opens). Report dead interactions.

---

## Anti-patterns (do NOT do these — they produce false results)
| Don't | Do |
|---|---|
| `await page.waitForTimeout(3000)` | web-first assertions / `waitForURL` (auto-wait) |
| `page.goto('http://localhost:3000/x')` | `page.goto('/x')` with `baseURL` |
| Mock your own API routes | let real routes run; mock only external services |
| Assert exact `next/image` URLs | assert `alt`, visibility, `naturalWidth > 0` |
| Call a Server Action as a function | trigger it through the UI |
| `npm run build` per test | reuse one server (`reuseExistingServer`) |

## Auto-fix
None. This skill observes runtime behaviour and reports; fixes belong to the static skills
(`audit-performance`, `audit-production-readiness`, `audit-error-handling`) once the offending route is known.
