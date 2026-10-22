---
name: setup-testing
description: Set up a comprehensive functional testing stack - Vitest (unit/integration) + Playwright (E2E) + MSW 3 + static analysis - and write tests covering every route, API endpoint, component, form, utility, and user journey, plus a TESTING.md matrix. Verifies the app works from a user's perspective. Use when setting up testing, adding Vitest/Playwright/MSW, scaffolding a test suite, or establishing test coverage. Pairs with /audit-tests (scored review of an existing suite).
disable-model-invocation: true
argument-hint: ""
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
last_verified: 2026-10-21
---

# setup-testing

Set up a complete testing stack and write tests that cover **every user-facing behaviour** - not just
tooling, actual comprehensive tests. Configs + checklists are in `references/` (2026: Vitest 4/5 (5.0 needs
Node >=22.12, Vite >=6.4) + Playwright + MSW 3). This is the `setup-` (scaffold) tier; the scored review of an existing suite is
`/audit-tests`.

> When to use: "set up testing", "add Vitest/Playwright", "scaffold a test suite", "we have no tests".

> **DETECT the stack, never assume it.** This skill previously hardcoded "Next.js 16 + port 3000"
> here and in its templates; run against a Vite SPA it produced a Playwright config pinned to
> `localhost:3000` that could never pass, and sat in git unnoticed for months. Read `package.json`
> and the workspace layout first, and take EVERY port, script name and env-var prefix from the repo
> in front of you (`VITE_*` vs `NEXT_PUBLIC_*`, `npm start` vs `vite preview`).

## 2026 deltas (apply these — they differ from older guides)

- **Playwright `webServer` builds and serves the PRODUCTION bundle**, NEVER `npm run dev` (dev flakes
  CI: HMR, source maps, different code paths). Test what you ship. Give it a **dedicated port** and
  set `reuseExistingServer: false` - on the app's own dev port, a `npm run dev` left running in
  another terminal is silently adopted and the whole suite runs against dev with nothing in the
  output saying so.
- **Vitest `env` block** with placeholder Supabase/Stripe vars - those clients throw at *import* if env
  is missing, crashing the runner before any assertion.
- **`@msw/playwright`** (official, 0.x, needs msw >=3) is an official alternative to the community `playwright-msw` for E2E network mocking.
- **happy-dom** (faster than jsdom) + **coverage thresholds** (80/80/75, a signal not a goal).
- This project's auth is **Supabase**, not Clerk - use the Supabase `auth.setup.ts` + storageState.

## Procedure

1. **Detect** existing setup (framework, language, test runner, scripts, auth=Supabase, DB). **Report +
   confirm the plan before installing.** Never replace a working setup; never install Jest+Vitest or
   Playwright+Cypress together.
2. **Static analysis scripts** - ensure `type-check`, `lint`, build exist in `package.json`.
3. **Install + configure** from `references/config.md`: Vitest (`vitest.config`, `tests/setup.ts`,
   `tests/mocks/handlers.ts`) and Playwright (`playwright.config.ts` with the production `webServer`).
   Match the project's path aliases. The default pool is `forks`; keep an existing `vmForks` pool, and
   use `vmForks` on Windows only if `forks` fails locally.
4. **Auth for E2E** - `e2e/auth.setup.ts` (Supabase login → storageState), gitignore `.playwright/.auth/`,
   add a SEEDED `TEST_USER_*` to `.env.local`. Split: mock auth in Vitest, real auth in Playwright.
5. **Map every testable surface** by **enumerating entry points** (`references/coverage.md`) - workspace
   `package.json` scripts, root servers, `supabase/functions` AND `supabase/migrations`, worker configs,
   scheduled jobs, then pages/components/utils. Ask "what can receive a request, run on a schedule, or
   be deployed?" **Also name what you cannot see** (n8n/Zapier/vendor automation) as out of scope.
   Present the inventory before writing tests - a surface you never discovered cannot be documented
   as a gap in step 10.
6. **Write tests for every surface** per the per-surface checklists in `references/coverage.md`
   (each page: loading/error/empty/auth; each endpoint: valid + invalid + status codes; each form:
   validation + submit + feedback; each util: edge + error). **Error paths outnumber happy paths.**
7. **E2E journeys** - one Playwright test per critical journey, role-based selectors, assert what the
   user sees, no `waitForTimeout`.
8. **Write `TESTING.md`** - the real test matrix populated from the inventory (template in
   `references/coverage.md`), and add a Testing section to the project `CLAUDE.md`.
9. **Verify** - run `type-check`, `lint`, `test`, `test:e2e`; fix config issues; everything must pass.
10. **Report** - coverage summary, what was installed/created, scripts added, and gaps that need manual
    review (document untestable surfaces in TESTING.md, don't skip silently).

## Rules

- **Every test uses real project code** - no generic placeholder tests; every route/endpoint/component/
  form/util gets one or a documented gap.
- **Mock at the service/boundary layer**, never the DB client internals; never hit a real DB or prod
  data in tests.
- **Test user-visible behaviour**, not implementation details. Role-based selectors only.
- E2E against the **production build**; unit/integration with **happy-dom** + module-level mocks.
- No snapshot tests, no coverage-chasing, no testing library internals (see anti-patterns in `coverage.md`).
- Async Server Components → test logic in Vitest, output in Playwright.

## See also
- `references/config.md` - Vitest/Playwright/MSW config templates (2026)
- `references/coverage.md` - per-surface checklists, project patterns, anti-patterns, TESTING.md
- `/audit-tests` - scored review of an existing suite (the audit tier)
