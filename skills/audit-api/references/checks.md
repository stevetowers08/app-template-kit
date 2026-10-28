# audit-api — check catalogue

Static checks for the **request/response contract** of the app's server boundary. **Stack-adaptive:**
on **Next.js** the surface is Route Handlers (`app/**/route.ts`) + Server Actions (`'use server'`);
on a **Vite SPA** it is the backend - Supabase Edge Functions (`supabase/functions/**/index.ts`, Deno
`Deno.serve`), an Express proxy (`server*.js`, root `api/**`), or serverless `/api` handlers. The
contract checks below are framework-agnostic; only the inventory and the two Next-only mechanics (API2a
Origin, API3b `NextResponse`) change. Verified against the official Next.js Data Security + Route
Handler docs, the Supabase Edge Functions docs, and the "5 Route Handler Zod failure modes" analysis.

Scope boundary: this skill owns the **API contract** (validation shape, status codes, error body,
rate limiting, response hygiene). It DEFERS secrets/headers/injection to `audit-security` and
DB query shape to `audit-database`. Where auth overlaps, audit-security owns the auth verdict;
here we only flag a totally missing validation/contract.

Inventory first (detect the stack, then list the surface):
- **Next.js:** `grep -rl "'use server'" src app` and `find app -name route.ts`.
- **Vite SPA:** `find supabase/functions -name index.ts`, plus the Express proxy (`server*.js`) and root
  `api/**` handlers. The greps below take a path arg - point them at `supabase/functions api server*.js`
  instead of `app` when auditing a SPA backend.

---

## API1. Input validation (weight: 30)

### API1a. Boundary reads input without Zod — HIGH
```
# Next.js
grep -rnE 'request\.(json|formData|text)\(\)' app                 # route handlers
grep -rln "'use server'" src app                                   # actions
# Vite SPA backend
grep -rnE 'await req(uest)?\.(json|formData|text)\(\)' supabase/functions api server*.js   # edge fns / express
```
Each must `safeParse` (or `parse`) the input through a Zod schema before use. TS types are erased at
runtime — types are not validation (this holds identically for Deno edge fns and Express). Report each
unguarded boundary.

### API1b. `parse` instead of `safeParse` on a user boundary — MEDIUM
```
grep -rnE '\.parse\(' app src | grep -iE 'request|formData|body|searchParams'
```
`.parse` throws and (without a handler) leaks a 500 + stack. Prefer `safeParse` → typed 400.
Fix: convert to `safeParse` + return 400 on `!success`. Guarded auto-fix under `--fix --validation`.

### API1c. FormData / coercion traps — MEDIUM
`FormData.get()` returns `string | File`; `z.coerce.boolean("false")` is **truthy**. Flag
`z.coerce.boolean` and numeric fields read from `formData` without explicit coercion handling. Report.

## API2. Authorization surface (weight: 20)

### API2a. State-changing handler with no auth/Origin re-verification — HIGH
**Next.js (Origin/CSRF angle):**
```
grep -rlnE 'export async function (POST|PUT|PATCH|DELETE)' app
```
Route Handlers lack the automatic Origin/Host CSRF check Server Actions get. Each mutating handler
needs an explicit `request.headers.get('origin')` check, or the mutation belongs in a Server Action.

**Vite SPA equivalent (edge fn / proxy auth, N/A the Next Origin grep):** a Supabase edge fn must
verify the caller, not trust the client. Flag a mutating edge fn that doesn't re-read the JWT
(`supabase.auth.getUser(jwt)` / `verify_jwt` not disabled in `config.toml`) or that reflects
`Access-Control-Allow-Origin: *` on an authenticated route instead of an allowlist.
```
grep -rln 'verify_jwt = false' supabase/functions          # auth turned off on an edge fn
grep -rnE "Access-Control-Allow-Origin['\"]?\s*[:,]\s*['\"]\*" supabase/functions   # wildcard CORS
```
Report (audit-security cross-references this as SEC2c).

### API2b. Mutation as a GET — HIGH
```
grep -rnE 'export async function GET' app | # then scan body for insert/update/delete/mutation
```
GET handlers must be side-effect-free (CSRF + caching correctness). Report any GET that mutates.

## API3. Status codes & responses (weight: 20)

### API3a. Error path returns 200 — MEDIUM
```
grep -rnE 'NextResponse\.json\(\s*\{\s*error' app | # check the status arg is set (4xx/5xx)
```
An error body returned with the default 200 breaks clients and caching. Fix: pass `{ status: 4xx }`.
Guarded auto-fix.

### API3b. Raw `Response`/`res.json` instead of `NextResponse` — LOW · **Next-only (N/A off-Next)**
```
grep -rnE 'new Response\(' app
```
Prefer `NextResponse.json` for typed headers/cookies. Report (advisory). On a **Vite SPA** this check
is `N/A`: Deno edge fns return a raw `Response` and Express uses `res.json` - both are correct, do not
flag them.

## API4. Error & response hygiene (weight: 20)

### API4a. Error body leaks internals — HIGH
```
grep -rnE 'json\(\{[^}]*(error|message):\s*(err|error|e)(\.message|\.stack|\b)' app src supabase/functions api server*.js
```
Returning `err.message`/`err.stack`/the raw error to the client leaks internals (CWE-209). Fix:
return a generic message + log the detail server-side. Report. (Equally a risk in edge fns / Express -
include the SPA backend paths in the grep.)

### API4b. Secret/over-broad object in response — HIGH
```
grep -rnE 'json\((row|data|user)\)' app src supabase/functions api | # full DB row may include private columns
```
Return a minimal DTO, not the whole row. Manual review; report candidates. (Edge fns that `select('*')`
then return it are the common SPA offender.)

## API5. Abuse protection (weight: 10)

### API5a. No rate limit on sensitive/expensive endpoints — MEDIUM
Login, OTP, password-reset, email-send, AI, write-heavy actions. Detect those routes/actions and
check for a limiter (`@upstash/ratelimit`, a `rate-limit` helper, the project's `increment_public_rate_limit`).
```
grep -rlnE 'login|otp|reset|verify|send.?email|forgot' app src supabase/functions api | xargs grep -Ln "rateLimit\|ratelimit\|increment_public_rate_limit"
```
Fix: add a limiter. Report (wiring is manual). On a SPA the sensitive endpoints are usually edge fns
(webhook receivers, AI/email senders) - point the scan at `supabase/functions` too.

---

## Auto-fix summary
| Check | Auto-fix? |
|---|---|
| API1b parse→safeParse+400 | Guarded |
| API3a error path status code | Guarded |
| everything else | No / report |
