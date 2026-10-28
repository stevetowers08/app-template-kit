# audit-security — check catalogue

Static checks for a **Next.js 16 (App Router) + React 19 + Supabase (or Clerk) + Stripe** app.
Verified against the official Next.js Data Security + CSP guides and OWASP Top 10 (2025). Defer
general dependency CVEs to `audit-dependencies`, monitoring to `audit-observability`, and
DB-internal RLS performance to `audit-database`.

Detect the boundary first: `proxy.ts` (Next 16, replaces `middleware.ts`), the Supabase clients
(`createServerClient` vs admin/`service_role`), and `next.config.*`. Anything that can only be
verified at the platform (WAF, env values in Vercel) → `SKIPPED (platform)`, never guessed.

---

## SEC1. Secrets & client boundary (weight: 25)

### SEC1a. Secret in a NEXT_PUBLIC_ var — CRITICAL
```
grep -rnE 'NEXT_PUBLIC_[A-Z_]*(SERVICE_ROLE|SECRET|PRIVATE|_KEY\b)' . --include=*.env* --include=*.ts --include=*.tsx
grep -rn 'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE' .    # must return ZERO
```
Only the Supabase **publishable** key (`sb_publishable_`; legacy anon key), project URL, Stripe **publishable** key, analytics IDs may be public.
Fix: rename to a non-public var; rotate the exposed key. Report only (rotation is manual).

### SEC1b. Service-role / admin client imported into client code — CRITICAL
```
grep -rln "createAdminClient\|service_role\|SERVICE_ROLE_KEY\|SUPABASE_SECRET_KEY\|sb_secret_" src app | xargs grep -l "'use client'" 2>/dev/null
```
Fix: move to a `server-only` Data Access Layer; add `import 'server-only'` to the module.
Auto-fixable (add `server-only` import) under `--fix --secrets`; the move is manual.

### SEC1c. `server-only` not used to guard secret modules — HIGH
Modules that read secrets/admin client should `import 'server-only'` (build-time barrier).
```
grep -rLn "import 'server-only'" $(grep -rln "SERVICE_ROLE_KEY\|SUPABASE_SECRET_KEY\|sb_secret_\|STRIPE_SECRET" src app)
```
Fix: add `import 'server-only'`. Auto-fixable.

### SEC1d. `.env` tracked in git — CRITICAL
```
git ls-files | grep -E '\.env($|\.local|\.production)'    # should be empty
```
Fix: `git rm --cached`, add to `.gitignore`, rotate. Report only.

## SEC2. Auth & authorization (weight: 25)

### SEC2a. Server Action without auth re-check — HIGH
Every `'use server'` action is a public POST endpoint; a page-level auth check does NOT cover it.
```
grep -rln "'use server'" src app    # then read each: must call getClaims/auth() + check session
```
Per the Next.js Data Security guide: re-verify **authentication AND authorization inside each action**.
Report each action missing an in-body auth check.

### SEC2b. Missing ownership/authorization check (IDOR) — HIGH
Action/handler takes a user-supplied `id` and acts on it without verifying ownership.
Detect: actions using a param `id`/`*_id` with no `org_id`/`user_id` ownership filter. Manual review;
report candidates. CWE-639.

### SEC2c. Route Handler without explicit Origin check on mutation — HIGH
Route Handlers do NOT get the automatic Origin/Host CSRF check Server Actions get.
```
grep -rlE "export async function (POST|PUT|PATCH|DELETE)" app --include=route.ts
```
Each state-changing handler must check `request.headers.get('origin')` or move to a Server Action.
Report; fix is manual (CWE-352).

### SEC2d. Treating proxy.ts/middleware as the only auth — HIGH
Auth logic present only in `proxy.ts`/`middleware.ts` with no per-handler re-check. Middleware is for
routing, not a security boundary. Report.

## SEC3. Input validation & injection (weight: 20)

### SEC3a. Boundary without Zod validation — HIGH
Server Action / Route Handler that reads `formData`/`request.json()` and uses it without a Zod parse.
```
grep -rnE 'request\.(json|formData)\(\)|formData\.get\(' app src | # cross-check a z. parse nearby
```
Fix: validate with `schema.safeParse(...)` before use. Report (adding schemas is manual).

### SEC3b. SQL string interpolation — CRITICAL
```
grep -rnE '\.(rpc|sql|query|raw)\(`[^`]*\$\{' src app supabase    # template-literal SQL
grep -rnE "from\(`?\$\{" src                                       # dynamic table name
```
Fix: parameterise. Report only.

### SEC3c. `dangerouslySetInnerHTML` without sanitisation — HIGH
```
grep -rn "dangerouslySetInnerHTML" src app    # each must wrap value in DOMPurify.sanitize()
```
Fix: sanitise with DOMPurify. Report.

## SEC4. Headers & CSP (weight: 15)

### SEC4a. No security headers configured — MEDIUM
```
grep -rnE "Content-Security-Policy|Strict-Transport-Security|X-Frame-Options" next.config.* proxy.ts middleware.ts
```
Missing CSP + HSTS = finding. Next 16: nonce-based CSP via `proxy.ts`, or hash/SRI for static pages.
Nonce CSP is incompatible with PPR / Cache Components (the `create-next-app` default since 16.4); use hash/SRI there.
Fix: add the headers block. Auto-fixable (scaffold a baseline header set) under `--fix --headers`.

### SEC4b. `'unsafe-inline'` / `'unsafe-eval'` in script-src — MEDIUM
```
grep -rnE "script-src[^;]*('unsafe-inline'|'unsafe-eval')" .
```
Fix: switch to nonce or hash-based CSP. Report.

## SEC5. Webhooks & framework CVEs (weight: 15)

### SEC5a. Stripe webhook without signature verification — CRITICAL
```
grep -rln "stripe" app/**/webhook*/route.ts | xargs grep -Ln "constructEvent\|webhooks.constructEvent"
```
Also: reading the body for Zod BEFORE `constructEvent` consumes the raw bytes it needs — flag if a
`.json()`/Zod parse precedes the signature check. Fix: verify signature on the raw body first. Report.

### SEC5b. Framework versions below the current advisory floor — HIGH

**Derive the floor, never read it from this file.** A hardcoded version here was wrong twice — it
named the `react` package (the advisory is against `react-server-dom-*`) and it named a floor two
patch lines below the real one. Query the advisory database, which is the source of truth:

```bash
# Every open advisory for the framework, with its per-minor-line patched version.
for pkg in next react-server-dom-webpack react-server-dom-turbopack react-server-dom-parcel; do
  echo "--- $pkg ---"
  curl -sf "https://api.github.com/advisories?affects=$pkg&per_page=100" \
  | python -c "
import json,sys
for a in json.load(sys.stdin):
    for v in a['vulnerabilities']:
        if v['package']['name']=='$pkg':
            print(a['severity'],a.get('cve_id'),v['vulnerable_version_range'],'->',v['first_patched_version'])"
done
# What the repo actually resolves to (the manifest range is not the installed version).
npm ls next react-server-dom-webpack react-server-dom-turbopack --depth=0 2>/dev/null
```

The global advisory database lags: some new GHSAs return 404 from `api.github.com/advisories`. Also read
the `nextjs.org/blog` security posts and the repo advisories page (`github.com/vercel/next.js/security/advisories`).

Compare the **resolved** version against the highest `first_patched_version` for its minor line.
Fix: bump + pin. Report (defer broad CVE scan to `audit-dependencies`).

**Measured floors as at 2026-10-21** - evidence of a past measurement, not a current fact; re-run
the query above before acting:

- **Next.js `16.4.1` / `15.5.28`** - security update 2026-10-14: GHSA-673q-mjm6-r5xr (Critical) and
  GHSA-p3m5-59mp-jv5r (High). No `16.3.x` patch exists, so a 16.3 app moves to 16.4.1.
- **`react-server-dom-*`** - GHSA-xqc2-xf4c-x3h3, patched per minor line at **19.0.9 / 19.1.10 /
  19.2.9 / 19.3.1**.
- **CVE-2025-55182 (React2Shell)** — critical unauthenticated RCE in React Server Components. It
  affects **`react-server-dom-webpack` / `-turbopack` / `-parcel`, NOT the `react` package**;
  patched per minor line at **19.0.1 / 19.1.2 / 19.2.1**. Next.js bundles the transport, so the
  practical fix in a Next app is the Next floor: **16.0.7** (also 15.0.5 / 15.1.9 / 15.2.6 /
  15.3.6 / 15.4.8 / 15.5.7), superseded by the 16.4.1 floor above.
  Sources: [GHSA-fv66-9v8q-g76r](https://github.com/advisories/GHSA-fv66-9v8q-g76r),
  [GHSA-9qr9-h5gf-34mp](https://github.com/advisories/GHSA-9qr9-h5gf-34mp).

### SEC5c. Permissive CORS on a route handler — MEDIUM
```
grep -rn "Access-Control-Allow-Origin.*\*" app src
```
Fix: restrict to known origins. Report.

---

## Auto-fix summary
| Check | Auto-fix? |
|---|---|
| SEC1a secret in NEXT_PUBLIC_ | No (rotate) |
| SEC1c add `server-only` | Yes |
| SEC4a missing headers | Yes (baseline) |
| everything else | No / report |
