# audit-production-readiness — check catalogue

Static checks for **deploy/build/runtime-config readiness**. **Stack-adaptive:** a **Next.js 16** app
on Vercel, or a **React + Vite SPA** on Vercel (both typically + Stripe/Supabase). Each check below
notes its stack; Next-only checks are marked and become `N/A` on a Vite SPA, which runs the Vite
equivalent instead. Verified against the Next.js 16 release notes, the official Vite env-and-mode +
Vercel/Vite SPA docs (`VITE_` vars are statically inlined into the client bundle at build time, Vite 8
/ Rolldown unchanged), and 2026 Vercel production checklists.

Scope boundary: this skill owns **build/config/deploy readiness**. It DEFERS the secret-in-client
*security verdict* to `audit-security` (here we check the build-inlining + Vercel-scope angle),
logging/Sentry to `audit-observability`, error boundaries to `audit-error-handling`, and cache
*performance* to `audit-performance` (here we check cache *correctness*).

Detect the stack first: **Next** (`next.config.*` present — major 16 = `proxy.ts` replaces
`middleware.ts`, Turbopack default, `cacheComponents`) vs **Vite SPA** (`vite.config.*` present, build
→ `dist/`, `vercel.json` for routing). Then: host (Vercel?), `.env*`, whether env is validated at
startup.

---

## PROD1. Env hygiene & validation (weight: 30)

### PROD1a. Secret reachable from a client bundle — CRITICAL
A public-prefixed var is **inlined into browser JS at build time** and frozen — anyone can read it in
DevTools. The prefix marks a var *public*; it does not protect it.
- **Next:** `NEXT_PUBLIC_*`, or a server-only var imported transitively into a `'use client'` module.
- **Vite:** `VITE_*` (official Vite guidance: `VITE_*` must not hold secrets — keep them on a server /
  edge fn and proxy). The Supabase **publishable** key (`sb_publishable_`; legacy anon key) under `VITE_` is fine
  (it's public by design); a **secret** key (`sb_secret_`), a legacy **service-role** key, or any
  secret/private token, under `VITE_` is the leak.
```
grep -rnE 'NEXT_PUBLIC_[A-Z_]*(SECRET|SERVICE_ROLE|PRIVATE|TOKEN|_KEY\b)' . --include=*.env*   # Next
grep -rnE 'VITE_[A-Z_]*(SECRET|SERVICE_ROLE|PRIVATE|TOKEN|PASSWORD|_KEY\b)' . --include=*.env*  # Vite
```
The `VITE_` value is also inlined at `vite build` time, so a var added to the Vercel dashboard *after*
a build does nothing until a rebuild. (Cross-ref `audit-security` SEC1 for the security verdict; here
flag as a deploy blocker.) Report.

### PROD1b. No env validation at startup — MEDIUM
App should fail fast on missing/invalid env (a Zod env schema), not crash mid-request in prod (or, for
a SPA, ship a build with an undefined key that white-screens at runtime).
```
grep -rln "process.env" src app lib | head             # Next: central validated env module (env.ts / t3-env)
grep -rln "import.meta.env" src | head                  # Vite: validate import.meta.env once at startup
```
For Vite, note `import.meta.env` does **not** exist inside `vite.config.*` (it runs in Node before env
is parsed) — config must use `loadEnv()`; and dynamic `import.meta.env[key]` access defeats static
replacement (key reads `undefined` in the build). Fix: add a validated env module. Report.

### PROD1c. Missing `.env.example` / env not documented, or `.env*.local` not gitignored — LOW
```
ls .env.example 2>/dev/null || echo "MISSING .env.example"
grep -qE '(^|/)\*?\.env\*?\.local|(^|/)\.env\.local' .gitignore || echo "WARN: .env*.local not gitignored"
```
Report (so prod deploys know every required var; Vercel scopes Dev/Preview/Prod separately — a common
miss is setting only Development). For Vite the precedence is `.env.[mode].local` > `.env.[mode]` >
`.env.local` > `.env`, and `*.local` files (which may hold secrets) must be gitignored.

## PROD2. Build & config correctness (weight: 30)

### PROD2a. Config correctness — HIGH
**Next 16 (removed/renamed next.config keys):**
```
grep -nE '^\s*(ppr|dynamicIO|useCache|eslint|amp|appIsrStatus|buildActivity)\s*:|skipMiddlewareUrlNormalize|serverRuntimeConfig|publicRuntimeConfig' next.config.*
grep -Pzl 'experimental:\s*\{[^}]*\bturbopack\s*:' next.config.*    # old nested turbopack key
```
`serverRuntimeConfig`/`publicRuntimeConfig` removed (use env); `experimental.turbopack` moved to top-level
`turbopack` (top-level is current and is not flagged); `experimental.ppr`/`dynamicIO`/`useCache` removed
(opt in with `cacheComponents` or drop the flag); `eslint`, `amp` and
`devIndicators.appIsrStatus`/`buildActivity` removed; `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`.
The first grep matches key lines at any nesting depth, so multi-line `experimental: { ... }` blocks are
caught; the second matches across lines (`-z`). Each present-but-old key is a finding. Guarded auto-fix
(rename) under `--fix --config`.

**Vite SPA equivalent (`vite.config.*`, N/A the Next grep above):**
```
grep -nE 'sourcemap:\s*true' vite.config.*                 # source maps shipped to prod → leaks source
grep -nE "base:\s*['\"]" vite.config.*                       # base must match deploy path (usually '/')
grep -nE 'build:\s*\{[^}]*outDir' vite.config.* ; cat vercel.json 2>/dev/null | grep -i outputDirectory
```
Flag: `build.sourcemap: true` left on for prod (ships readable source — drop it or use `'hidden'`);
`base` not matching the deploy path (broken asset URLs); `build.outDir` disagreeing with Vercel's
`outputDirectory` (default `dist`). Avoid putting real secrets in `define:` — those values are inlined
verbatim into the bundle, same leak surface as a `VITE_` var. Report (config edits are manual).

### PROD2b. `console.log` in production code — MEDIUM
Project rule: no `console.log` in production code (use a logger or remove).
```
grep -rnE '\bconsole\.(log|debug)\(' src app lib --include=*.ts --include=*.tsx | grep -vE '\.test\.|\.spec\.'
```
Fix: remove or route through the logger. Guarded auto-fix (remove) under `--fix --logs`.

### PROD2c. Image config drift (Next 16 defaults changed) — LOW · **Next-only (N/A off-Next)**
`images.minimumCacheTTL` now 4h, `qualities` now `[75]`, `dangerouslyAllowLocalIP` blocked by default,
`maximumRedirects` now 3. Flag configs relying on old defaults. Report. (Vite has no `next/image` — `N/A`.)

### PROD2d. Case-sensitive import risk — LOW
Linux (Vercel) is case-sensitive; macOS/Windows are not — a wrong-case import builds locally, fails on
Vercel. Heuristic: imports whose case doesn't match the file on disk. Report candidates.

## PROD3. Caching & runtime correctness (weight: 20)

### PROD3a. Caching headers — MEDIUM
**Next (public API routes):** public, cacheable GET handlers should set
`Cache-Control: public, s-maxage=..., stale-while-revalidate=...`.
```
grep -rlnE 'export async function GET' app | xargs grep -Ln 'Cache-Control\|revalidate'
```
**Vite SPA equivalent:** Vite emits content-hashed asset filenames, so the static assets should be
served `Cache-Control: public, max-age=31536000, immutable` while `index.html` must **not** be
immutable (it's the pointer to the latest hashed bundles). Check `vercel.json` `headers`:
```
cat vercel.json 2>/dev/null | grep -iE 'cache-control|immutable|assets'
```
Flag: no immutable header on `/assets/*`, or an `immutable`/long max-age applied to `index.html`.
Report (correctness/cost; not a security issue).

### PROD3b. Edge runtime with Node-only APIs — HIGH · **Next-only (N/A off-Next)**
```
grep -rln "runtime = 'edge'\|runtime = \"edge\"" app | xargs grep -lnE "from 'fs'|from 'crypto'|bcrypt|Prisma|node:" 2>/dev/null
```
Edge runtime is deprecated, and Cache Components rejects any `runtime` export. Edge runtime lacks Node
APIs (fs, bcrypt, Prisma, native crypto) - will fail at runtime. Fix: drop the
edge export or move the Node work to a serverless route. Report. (A Vite SPA ships no server runtime —
`N/A`. Supabase edge fns are Deno with their own API surface, audited under `audit-api`/`audit-security`.)

### PROD3c. Non-serializable prop across server→client — MEDIUM · **Next-only (N/A off-Next)**
Passing a function/Date/class instance from a Server Component to a Client Component causes silent
failure / hydration error.
```
# heuristic: client component props typed as Date/function passed from a server parent — manual review
```
Report candidates. (No RSC boundary in a Vite SPA — `N/A`.)

## PROD4. Deploy readiness (weight: 20)

### PROD4a. Test-mode keys in production config — CRITICAL
```
grep -rnE 'sk_test_|pk_test_|whsec_test|_test_' . --include=*.env.production* --include=*.env
```
Stripe live keys + a **separate** production webhook signing secret are required (test/CLI secret ≠
live). Report.

### PROD4b. No error boundary — MEDIUM
- **Next:** App Router needs `error.tsx` on risky segments + a root `global-error.tsx`.
```
find app -name error.tsx | head; ls app/global-error.tsx 2>/dev/null || echo "no global-error.tsx"
```
- **Vite SPA:** needs at least one top-level React error boundary so a render throw shows a fallback,
  not a white screen (a class `componentDidCatch`/`ErrorBoundary`, react-router `errorElement`, or
  `react-error-boundary`).
```
grep -rlnE 'componentDidCatch|getDerivedStateFromError|errorElement|react-error-boundary' src | head
```
(Defer the *handling quality* to `audit-error-handling`; here it's a deploy-readiness presence check.)
Report.

### PROD4c. Routing/deploy config — LOW
**Next 16:** `middleware.ts` is deprecated; `proxy.ts` (Node runtime) is the replacement.
```
ls middleware.ts src/middleware.ts 2>/dev/null
```
**Vite SPA equivalent (N/A the middleware check):** a client-routed SPA needs a `vercel.json` rewrite
of all paths to `/index.html`, or deep links / refreshes 404. Also flag `trailingSlash` not set to
`false` (causes 308 redirects → SEO "page with redirect"), and the `cleanUrls:true` gotcha (destination
must be `/index`, not `/index.html`).
```
cat vercel.json 2>/dev/null | grep -iE 'rewrites|index.html|index"|trailingSlash|cleanUrls' \
  || echo "WARN: no vercel.json rewrite — SPA deep links will 404 on Vercel"
```
Report (migration / deploy item).

---

## Auto-fix summary
| Check | Auto-fix? |
|---|---|
| PROD2a rename removed config keys | Guarded |
| PROD2b remove `console.log` | Guarded |
| everything else | No / report |
