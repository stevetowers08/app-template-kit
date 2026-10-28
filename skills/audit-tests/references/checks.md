# audit-tests — check catalogue

Static checks for test strategy in a **Vitest 4/5 (5.0 needs Node >=22.12, Vite >=6.4) + Playwright + Next.js 16** app. Verified against the
official Next.js testing guide and the 2026 Vitest/Playwright consensus. Jest is replaced; Cypress
not used.

**Vitest 4 config drift — flag on any repo still carrying v3 shapes:** a nested `poolOptions` block
is removed in v4 (flattened to top-level `maxWorkers`, `vmMemoryLimit`), and `@vitest/coverage-v8`
must be the exact vitest version (pinned peer). v4 also makes AST-aware coverage remapping mandatory, so a `thresholds`
block carried over from v3 measures something different — treat an unexplained coverage drop after a
v4 bump as a re-baseline, not a regression.

**Vitest 5 config drift - flag on any repo on v5 (or bumping to it) still carrying v4 shapes:**
`coverage.include`/`exclude` match paths relative to the project root (re-check every pattern); config
files are not looked up in parent directories, so a monorepo package needs `--config`; `clearMocks`
defaults to `true`, so a test that reads mock call history across tests fails; `vi.mock` inside
`describe` or a function throws; an unawaited `resolves`/`rejects` assertion fails the test;
`test.sequential` is removed; `@cloudflare/vitest-pool-workers` peers vitest ^4.1.0, so Workers tests
stay in their own Vitest 4.1 project. Vitest 5.0 needs Node >=22.12 and Vite >=6.4 - flag a lower
`engines.node` or `vite` range.

Read `vitest.config.*`, `playwright.config.*`, `package.json` test scripts, and `.claude/rules` /
`TESTING.md` first — honour the project's stated conventions (e.g. one production app: `vmForks` on
Windows where `forks` fails locally, module-level Supabase mock, every util needs a unit test, every public route needs
an E2E a11y test).

---

## TST1. Coverage of critical logic (weight: 30)

### TST1a. Untested utility / pure function — HIGH
Project rule: every util/pure function gets a unit test.
```
# functions in src/lib & src/utils with no matching *.test.ts
for f in $(grep -rln 'export function\|export const' src/lib src/utils 2>/dev/null); do
  base=$(basename "$f" .ts); ls "$(dirname "$f")/$base".test.* 2>/dev/null || echo "UNTESTED: $f"; done
```
Report each. Not auto-fixed (writing meaningful tests is manual).

### TST1b. Server Action decision logic untested — HIGH
Auth checks, validation, rate-limit, error propagation, redirect targets are pure logic — test in
Vitest. Flag `'use server'` files with no test. Report.

### TST1c. Critical journey without an E2E test — HIGH
Auth, checkout/payment, core feature flows, and (project rule) every public route needs a Playwright
test (incl. a11y). Cross-check `app/` public routes against `e2e/`. Report gaps.

## TST2. Test pyramid balance (weight: 20)

Count `*.test.*`/`*.spec.*` (unit/integration) vs `e2e/**`. Healthy ≈ 70% unit, 20% integration,
10% E2E (integration-heavy is also fine with MSW). Flag inversions:
- Mostly E2E, few unit → slow, flaky suite. HIGH.
- 100% unit, zero E2E on a product app → critical paths unverified. HIGH.
Report the ratio + verdict. Advisory.

## TST3. Mock strategy (weight: 25)

### TST3a. Mocking the function under test — HIGH
A test that mocks the very thing it claims to test proves nothing.
```
# heuristic: a test file that vi.mock()s a module it also imports as the subject
```
Manual review of flagged files. Report.

### TST3b. Mock at the wrong layer — MEDIUM
Mock at the boundary (network/DB/auth), not deep internals. Project rule: mock Supabase at the
**module level** (`vi.mock('@/integrations/supabase/client')`), never hit a real DB in unit tests.
```
grep -rln "supabase" src --include=*.test.ts | xargs grep -Ln "vi.mock"    # tests touching supabase w/o a mock
grep -rnE 'createClient\(|new Pool\(|DATABASE_URL' **/*.test.ts            # real DB in a unit test
```
Report. CRITICAL if a unit test hits a real DB / production data.

### TST3c. Async Server Component rendered in Vitest — MEDIUM
Vitest cannot render async Server Components (capability gap). Flag `render(<AsyncServerComp/>)` in
Vitest; push to Playwright. Report.

## TST4. Reliability & config (weight: 15)

### TST4a. Arbitrary waits / sleeps (flakiness) — MEDIUM
```
grep -rnE 'waitForTimeout\(|setTimeout\(|sleep\(' e2e tests **/*.spec.ts
```
Use Playwright auto-waiting / web-first assertions, not fixed sleeps. Report.

### TST4b. Coverage thresholds + CI retries config — LOW
`vitest.config` should set coverage thresholds (~80 lines/functions, 75 branches) AND the pool the
project needs (the default is `forks`; `vmForks` on Windows only if `forks` fails locally). `playwright.config` should set `retries` on CI, `trace: 'on-first-retry'`,
and `forbidOnly` in CI. Flag missing. (Note: thresholds are a signal, not the goal — critical-path
coverage matters more.) Report.

### TST4c. Tests run against production data — CRITICAL
```
grep -rnE 'PROD|production|live' playwright.config.* e2e | grep -iE 'baseURL|DATABASE_URL'
```
E2E must use a seeded test environment, never prod. Report.

### TST4d. Coverage thresholds without `coverage.include` - MEDIUM
`coverage.thresholds` is set but `coverage.include` is not. Without `include`, only files a test loads
are measured (`coverage.all` is removed in Vitest 4), so an untested file never counts against the
thresholds and a passing gate overstates coverage.
```
grep -nE -A12 'coverage\s*:' vitest.config.* vitest.workspace.* 2>/dev/null    # read the coverage block, not test.include
```
Flag a `coverage` block with `thresholds` and no `include`. Fix: `include: ['src/**/*.{ts,tsx}']` (the
repo's source globs) and exclude test files. Report.

## TST5. Test smell / over-testing (weight: 10)

Flag low-value tests to delete: snapshot spam, framework-binding tests (asserting React calls
useEffect), CRUD-only E2E, mock-everything suites.
```
grep -rln 'toMatchSnapshot' src tests
```
Report (advisory — fewer, higher-signal tests beat coverage theatre).

---

## Auto-fix summary
Nothing here is safely auto-fixable — writing/repairing tests is judgement work. `--fix` is a no-op
for this skill except it may scaffold a **missing** coverage-threshold/retries config block under
`--fix --config` (guarded). Everything else: report only.
