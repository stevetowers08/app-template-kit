# setup-testing - config templates (2026: Vitest 4/5 (5.0 needs Node >=22.12, Vite >=6.4) + Playwright + MSW 3)

Install: `npm i -D vitest @vitest/coverage-v8 @vitejs/plugin-react vite-tsconfig-paths
@testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom happy-dom msw
@playwright/test @msw/playwright`. Then `npx playwright install chromium`.

**`@vitest/coverage-v8` must be the exact vitest version** (it peers vitest at that exact version) - bump both together.

## Adding this to a repo already on Vitest 3 or 4

### Vitest 3 -> 4

`defineConfig`, `environment`, `globals`, `setupFiles` and a bare `pool:` line are unchanged in v4.
Two things do break:

- **Nested `poolOptions` is removed**, flattened to top-level keys: `poolOptions.<pool>.maxThreads`/
  `maxForks` → `maxWorkers`, `poolOptions.vmThreads.memoryLimit` → `vmMemoryLimit`. If the repo's
  config has a `poolOptions` block, flatten it; the template below has none, so it needs no change.
- **AST-aware coverage remapping is now mandatory** (the v3 opt-in flag is gone). Coverage
  percentages shift on the same tests. **Re-baseline any `thresholds` block** — do not carry the
  old numbers over and read the drop as a regression.

### Vitest 4 -> 5 (needs Node >=22.12, Vite >=6.4)

Source: vitest.dev/guide/migration. The breaking changes that reach a typical config:

- **`coverage.include` / `coverage.exclude` match paths relative to the project root.** Re-check every pattern.
- **Config files are not looked up in parent directories.** In a monorepo, pass `--config <path>` from each package.
- **`clearMocks` defaults to `true`**, so mock call history resets before each test.
- **`vi.mock` inside `describe` or a function throws.** Call it at the top level of the file.
- **Unawaited `resolves` / `rejects` assertions fail the test.** `await` each one.
- **`test.sequential` is removed** (see the migration guide).
- **`@cloudflare/vitest-pool-workers` has no Vitest 5 support** (it peers vitest ^4.1.0). Keep Workers tests in their own project on Vitest 4.1.

## vitest.config.ts (or `.mts`)
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: 'happy-dom',          // faster than jsdom, fine for React (use jsdom if a test needs it)
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'supabase/functions/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    // pool: 'vmForks',                 // default pool is forks; use vmForks on Windows only if forks fails locally
    // Supabase/Stripe clients throw at IMPORT if these are missing.
    // USE THE REPO'S OWN PREFIX - VITE_* for Vite, NEXT_PUBLIC_* for Next.
    // Point the URL at a host that does not exist: with MSW erroring on
    // unhandled requests, that makes reaching the real project impossible
    // rather than merely discouraged.
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',   // or NEXT_PUBLIC_SUPABASE_URL
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
      STRIPE_SECRET_KEY: 'sk_test_placeholder',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],   // untested files under src/ are reported; without include only files a test loads are measured
      exclude: ['node_modules/**', '.next/**', '**/*.config.*', '**/*.d.ts', '**/types.ts', 'tests/**', '**/*.{test,spec}.{ts,tsx}'],
      thresholds: { lines: 80, functions: 80, branches: 75 },  // a signal, not the goal — critical-path > %
    },
  },
});
```

## tests/setup.ts  (MSW 3, Node interceptor)
```ts
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

export const server = setupServer(...handlers);
// Start with 'warn' to discover unhandled requests, then tighten to 'error' once handlers are complete.
// onUnhandledFrame covers HTTP requests and WebSocket connections. A custom callback receives
// { frame, defaults }: check frame.protocol, then call defaults.warn() or defaults.error().
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());   // forgetting this leaks handlers between tests (order-dependent flakes)
afterAll(() => server.close());
```

## tests/mocks/handlers.ts  (populate with EVERY API route the app calls)
```ts
import { http, HttpResponse } from 'msw/http';
export const handlers = [
  // http.get('/api/deals', () => HttpResponse.json([{ id: '1' }])),
  // http.post('/api/deals', () => HttpResponse.json({ id: '2' }, { status: 201 })),
];
```

## playwright.config.ts  (e2e against the PRODUCTION build — never dev)
```ts
import { defineConfig, devices } from '@playwright/test';

// A DEDICATED port, deliberately NOT the app's dev port.
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 5399);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,   // 1 in CI if tests share a DB
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: BASE_URL,   // see PORT below - take it from the repo, do not assume 3000
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },                                  // auth/seed
    { name: 'chromium', use: { ...devices['Desktop Chrome'], storageState: '.playwright/.auth/user.json' }, dependencies: ['setup'] },
    { name: 'unauthenticated', testMatch: /.*\.unauth\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // PRODUCTION build - dev mode flakes CI (HMR, source maps, different code
    // paths). Substitute the repo's real commands: `npm run build && npm start`
    // for Next, `vite build && vite preview --port <PORT>` for Vite.
    command: `npm run build && npm start -- --port ${PORT}`,
    url: BASE_URL,
    // NEVER reuse. With reuse on the app's dev port, a `npm run dev` left
    // running in another terminal is silently adopted and the whole suite runs
    // against DEV - the exact thing this config exists to avoid, with nothing
    // in the output saying so. Give E2E its own port instead.
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
```

## e2e/auth.setup.ts — Supabase (this project's auth)
```ts
import { test as setup } from '@playwright/test';
const authFile = '.playwright/.auth/user.json';
setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForURL('**/dashboard**');
  await page.context().storageState({ path: authFile });
});
```
Gitignore `.playwright/.auth/`; add `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` to `.env.local` (a SEEDED
test user, never a real one). For Clerk projects instead: `@clerk/testing` with `pk_test_` keys, or a
dev-auth bypass (`SKIP_CLERK_AUTH`).

## @msw/playwright (official alternative to community `playwright-msw`; 0.x, needs msw >=3)
`npm i -D @msw/playwright`; wire `defineNetworkFixture` in `e2e/fixtures.ts` so Playwright tests reuse
the SAME `handlers`. Uses `page.route()` internally - no `npx msw init public/` needed.
`onUnhandledFrame` defaults to `'bypass'`, which sends unmocked requests to the real network; set `'error'`:
```ts
const network = defineNetworkFixture({ context, handlers, onUnhandledFrame: 'error' });
await network.enable();
```

## package.json scripts (add only what's missing)
```
"type-check": "tsc --noEmit", "lint": "eslint .",
"test": "vitest run", "test:watch": "vitest", "test:coverage": "vitest run --coverage",
"test:e2e": "playwright test", "test:e2e:ui": "playwright test --ui"
```
