---
name: audit-api
description: Audit an app's API contract - stack-adaptive across Next.js App Router (Route Handlers app/**/route.ts + Server Actions 'use server') and React+Vite SPAs whose backend is Supabase Edge Functions, an Express proxy, or serverless /api handlers. Checks input validation (Zod safeParse at every boundary, FormData/coercion traps), authorization surface (auth re-verified on mutations; Next Route Handler Origin checks / edge-fn JWT + CORS allowlist; no mutating GETs), status codes (no 200-on-error), error/response hygiene (no leaked internals or full DB rows), and abuse protection (rate limiting on sensitive endpoints). Reports a scored summary by default; pass --fix for safe low-risk fixes. Use when asked to audit/check/review API routes, server actions, edge functions, request validation, or endpoint error handling.
disable-model-invocation: true
argument-hint: "[--fix] [--validation|--status|--errors]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
last_verified: 2026-08-21
---

# audit-api

Scan the **request/response contract** of the app's server boundary - Next.js Route Handlers +
Server Actions, **or** a Vite SPA's Supabase Edge Functions / Express proxy / serverless `/api`
handlers: validation, authorization surface, status codes, error-body hygiene, and abuse protection.
The contract checks are framework-agnostic; only the *surface* (where handlers live) and a couple of
Next-only mechanics differ. Report a **scored** summary. With `--fix`, apply only mechanical low-risk
fixes (parse→safeParse+400, error-path status code); auth, rate-limit wiring, and schema authoring are
report-only.

> When to use: "audit our API / routes / server actions", "are our endpoints validated", "check error
> responses / status codes". Mirrors the `audit-database` report shape for `/full-audit`. Keep the
> template stable. Owns the API contract; defers secrets/headers/injection to `audit-security`, query
> shape to `audit-database`. Where auth overlaps, `audit-security` owns the auth verdict.

## Modes

| Invocation | Behaviour |
|---|---|
| `/audit-api` (default) | **Report only.** Run every check, score, output the report. |
| `/audit-api --fix` | Report, then apply guarded fixes (parse→safeParse, error status codes). Ask before each. |
| `--fix --validation` / `--status` / `--errors` | Limit fixes to that dimension. |

`--fix` NEVER authors a Zod schema for you, wires a rate limiter, or changes auth without confirmation.

## Procedure

1. **Detect the stack/backend FIRST, then inventory** (the checks are universal; only the targets move).
   - **Next.js App Router:** `find app -name route.ts` (Route Handlers) + `grep -rl "'use server'" src app`
     (Server Actions).
   - **Vite/SPA (no server in the app itself):** the boundary lives in the backend - `find supabase/functions
     -name index.ts` (Deno `Deno.serve` edge fns), the Express proxy (`server*.js`, root `api/**`), and any
     serverless `/api` handlers.
   Gate the Next-only checks (API2a Origin, API3b `NextResponse`) `N/A` off-Next and apply their SPA
   equivalents instead (edge-fn JWT/CORS for API2; raw `Response`/`res.json` is correct for API3) - see
   `references/checks.md`.
2. **Run the checks** in `references/checks.md` (API1-API5) by Grep, reading each flagged handler to
   confirm (a nearby `safeParse` clears API1a). Read `.claude/rules/*.md` for project conventions.
3. **Score** each dimension; compute the overall grade.
4. **Output the report** (template below).
5. **If `--fix`:** apply guarded fixes, re-check, run `npm run type-check`. Report applied vs deferred.

## Scoring

Start each dimension at 100; subtract per finding (CRITICAL -40, HIGH -20, MEDIUM -10, LOW -3,
floor 0). Overall = weighted mean.

| Dim | Weight | Covers |
|---|---|---|
| API1 Input validation | 30 | Zod safeParse at every boundary, parse-vs-safeParse, FormData/coercion traps |
| API2 Authorization surface | 20 | auth re-verified on mutations; Next: Route Handler Origin check / SPA: edge-fn JWT verify + CORS allowlist; no mutating GETs |
| API3 Status codes & responses | 20 | no 200-on-error; Next: NextResponse over raw Response (N/A on edge fn / Express, where raw Response/res.json is correct) |
| API4 Error & response hygiene | 20 | no leaked `err.message`/stack, minimal DTO not full row |
| API5 Abuse protection | 10 | rate limiting on login/OTP/reset/email/AI/write endpoints |

Grade: A ≥90, B ≥80, C ≥70, D ≥60, F <60.

## Report template (keep stable - the audit pipeline parses this)

```
# API Audit - <project> - <grade> (<overall>/100)

Mode: report | fix    Backend: <Next App Router | Vite SPA: Supabase edge fns / Express proxy>    Surface: <n handlers / n actions / n edge fns>

| Dimension | Score | Findings |
|---|---|---|
| API1 Input validation         | NN | n |
| API2 Authorization surface    | NN | n |
| API3 Status codes & responses | NN | n |
| API4 Error & response hygiene | NN | n |
| API5 Abuse protection         | NN | n |

## Findings
### [SEVERITY] <id> <title>   (check API1a)
- Where: <file:line>
- Evidence: <grep hit>
- Fix: <one line>  •  Auto-fixable: yes/no/guarded
- Applied: yes/no/deferred   (only in --fix mode)
```

## Rules

- A nearby Zod `safeParse` on the same input clears API1a — read the handler, don't flag on grep alone.
- **Stack-adaptive.** Detect the backend first; the contract checks are universal, but mark Next-only
  mechanics (`request` Origin check, `NextResponse`) `N/A` on a Vite SPA and audit its edge-fn/proxy
  equivalents instead. Never throw a `NextResponse` finding at a Deno edge function.
- Report-only is the default. Auto-fix only the guarded checks in `references/checks.md`, one at a time.
- Never author schemas, wire rate limiters, or change auth without explicit confirmation.
- Match project conventions on conflict (`.claude/rules/*.md`).
- Keep the report under ~600 lines; no raw command dumps unless flagging a finding.

## See also
- `references/checks.md` - probe + fix catalogue
- Siblings: `audit-security` (auth/secrets/injection), `audit-error-handling` (error propagation patterns)
