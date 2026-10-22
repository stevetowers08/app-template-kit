# setup-testing — what to cover, project patterns, anti-patterns, TESTING.md

## Map every testable surface FIRST — enumerate ENTRY POINTS, don't glob one framework

> The globs below used to be a fixed Next.js list (`find app -name page.tsx`, `find app/api -name
> route.ts`, …). Run against a Vite SPA + monorepo that found the pages and utils and **nothing
> else** — it missed a 2,279-line Express proxy at the repo root, a Cloudflare Worker in its own
> workspace, 31 Supabase edge functions, and every SQL processor and cron job. The skill then
> reported success. **You cannot document a surface you never discovered**, so step 10's
> "document untestable surfaces" never fired. Ask *"what can receive a request, run on a schedule,
> or be deployed?"* — never *"where are the pages?"*.

**Step 1 — what ships. Read these before globbing anything:**
```
cat package.json                                  # scripts: dev/build/start/server/worker/deploy
ls */package.json apps/*/package.json packages/*/package.json   # every workspace is its own surface
ls Dockerfile Procfile wrangler.toml fly.toml vercel.json netlify.toml 2>/dev/null
ls supabase/ 2>/dev/null                          # functions/ AND migrations/ are both testable
git ls-files | grep -iE "^server|^api/|\.server\.(ts|js)$"      # root servers the globs miss
```

**Step 2 — per surface type found above:**
```
# Framework pages/routes — match the framework you ACTUALLY found
find . -name "page.tsx" -not -path "*/node_modules/*" | sort        # Next.js app router
grep -rlE "createBrowserRouter|<Route |path=" src apps --include=*.tsx | sort   # SPA routers
find . -name "route.ts" -not -path "*/node_modules/*" | sort        # Next.js route handlers

# Server / HTTP surfaces
grep -rlE "express\(\)|new Hono|Deno\.serve|createServer" . --include=*.ts --include=*.js \
  | grep -v node_modules | sort

# Scheduled work
grep -rniE "cron\.schedule|pg_cron|schedule\(|\"crons\"|scheduled" . --include=*.ts --include=*.sql \
  --include=*.toml --include=*.json | grep -v node_modules | sort -u

# Database logic (functions, triggers, RLS) — a first-class layer, not an afterthought
grep -rliE "create (or replace )?function|create trigger|create policy" supabase/migrations 2>/dev/null | sort

# Interactive components + utilities
grep -rl "onClick\|onSubmit\|onChange\|<form" src apps --include=*.tsx | sort
find src/lib src/utils -name "*.ts" | sort
```

**Step 3 — name what you CANNOT see.** Off-repo automation (n8n, Zapier, Make, vendor dashboards),
third-party contracts, and anything behind a login will never appear in a glob. List them in
TESTING.md as explicitly out of scope, so each is a decision rather than an omission.

Present the inventory — including step 3 — before writing tests.

## Per-surface coverage (what each test file must assert)

**Page/route** — renders · data-loaded content · loading · error (mock 500) · empty (mock []) · auth
redirect (if protected) · role variants · links navigate · dynamic route: valid id / 404 / malformed id.

**API endpoint** — valid request → correct status (200/201/204) · 400 invalid body · 400 wrong types ·
401 no auth · 403 no permission · 404 missing (`[id]`) · 405 wrong method · empty body · response shape.
Mutations also: creates/updates/deletes correctly · returns the resource · validates required fields ·
idempotent (PUT/DELETE).

**Interactive component** — default/loading/error/disabled/empty states. **Forms:** fields + labels ·
submit present · valid submit calls handler with right data · validation error per required field ·
validation per invalid field · submit disables during submission (no double-submit) · success feedback ·
error feedback · resets/navigates after success · cancel resets. **Buttons:** click → action · loading ·
success/error feedback · destructive → confirm dialog. **Lists/tables:** renders items · empty state ·
pagination · sort · filter · row actions.

**Utility** — typical input · edge cases (empty/0/null/undefined) · boundaries · throws on invalid ·
unicode/special chars.

**Express/Fastify/Hono server or proxy** — **supertest**, in-process (it binds an ephemeral loopback
port itself). Per route: valid → status · 400 invalid · 401/403 unauthorised · 404 · 405 wrong method ·
upstream failure surfaces as an error, not a 200 with an empty body. Two prerequisites: the app must
be **exported** (`export default app`), and a module-scope `app.listen()` runs on import — bind an
ephemeral port (`PORT=0`) or guard it. Same import-time-side-effect trap as `Deno.serve`.

**Database logic (functions, triggers, RLS)** — the highest-leverage, most-skipped layer. **pgTAP**
via `supabase test db`, deny-path first: self=allow · other=deny · unauthenticated=deny, with `FORCE
ROW LEVEL SECURITY`. Business rules living in SQL (an ingestion path that must never INSERT, a status
that must not move backward, a dedup key) are **invisible to every application-layer test** — an edge
function test covers the payload that FEEDS the processor, never the decision itself.
**No Docker?** Use a Supabase **branch** (Pro plan, migrations applied on deploy, billable — get
explicit approval). Don't silently drop the layer.

**Scheduled jobs (cron, pg_cron, worker schedules)** — don't test that the process is alive; assert
**today's run finished**. Heartbeat *after* success (never at the top of the job), alert on the
*absence* of the ping. That catches wrong cron expression, skipped deploy, stuck job and dead server —
the failure modes an exception-based test cannot see.

**E2E journeys** (Playwright, role-based selectors, assert what the user sees): sign-up → onboarding →
main · login → see data · primary action → result · CRUD round-trip · settings persist after reload ·
error → message → recover · navigate every page · protected page without auth → redirect.

## Playwright selector priority
`getByRole` → `getByLabel` (inputs) → `getByText` → `getByTestId` (last resort). **Never** CSS selectors
for user-facing elements. **Never** `waitForTimeout` — use web-first assertions / `waitForURL`.

## Project-specific patterns
- **Mock at the service/boundary layer, not the DB client.** `vi.mock('@/services/...')` or the
  module-level Supabase mock (`vi.mock('@/integrations/supabase/client')`) — never hit a real DB in unit
  tests, never mock `@supabase/supabase-js` internals. Complex chained `.from().select().eq().single()`
  → intercept with MSW instead.
- **Async Server Components can't render in Vitest** — test their data-fetching logic in Vitest, test the
  rendered output via Playwright.
- **Multi-stage pipelines (LLM/AI):** test each stage in isolation, mocking upstream stages with MSW
  (`server.use(http.post('/api/titles', ...))`).
- **Retry/circuit-breaker/fallback logic:** dedicated tests — fallback ordering, skip-after-N-failures,
  open state, recovery after cooldown.
- **Error paths outnumber happy paths.** MSW makes it trivial: `HttpResponse.json(null,{status:500})`,
  `HttpResponse.error()` (network), a `setTimeout` (timeout), 429 (rate limit), partial-batch failure.
- **Auth mocking split:** mock auth hooks in Vitest (never import real auth); use real auth in Playwright
  (seeded test user via storageState).

## Anti-patterns — do NOT
- No snapshot tests (break on every UI change, test nothing).
- No testing shadcn/ui or third-party internals (Button renders, Supabase queries run — test YOUR logic).
- No chasing 100% coverage (cover user-facing behaviour; thresholds are a signal).
- No asserting on internal state / CSS classes / component tree.
- No mocking internal modules you own — mock external boundaries (network/DB/auth) only.
- Never install both Jest+Vitest or Playwright+Cypress; never replace a working setup; never run e2e
  against the dev server.

## TESTING.md (write at project root — the real matrix, populated from the inventory)
```
# Test Matrix
## Quick Commands  (type-check | lint | build | test | test:coverage | test:e2e)
## Pages         | Route | Renders | Data | Loading | Error | Empty | Auth | Test File | Status |
## API Endpoints | Endpoint | Method | Valid | Invalid | No-Auth | Not-Found | Test File | Status |
## Components    | Component | Renders | Interaction | Loading | Error | Empty | Test File | Status |
## Forms         | Form | Valid Submit | Validation | Double-click | Success | Error | Test File | Status |
## User Journeys | Journey | Steps | Auth | Test File | Status |
## Utilities     | Function | File | Happy | Edge | Error | Test File | Status |
## Edge cases (cross-cutting): no data / fetch fails / empty submit / double submit / no auth / 0|1|100 items / bad id / mid-mutation failure / back-forward / refresh-with-state
## Pre-Ship: tsc + eslint + build + unit + e2e all pass; every page has loading/error/empty; every endpoint valid+invalid; every form validation+submit; every journey an e2e; no console.log in tests
```
