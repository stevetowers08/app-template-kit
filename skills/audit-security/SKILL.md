---
name: audit-security
description: Audit a Next.js + Supabase/Clerk + Stripe app for security anti-patterns - secrets/client-boundary leaks (NEXT_PUBLIC_ misuse, service-role in client, server-only/DAL), auth & authorization (re-verify inside server actions/route handlers, IDOR, middleware-is-not-a-boundary), input validation & injection (Zod at boundaries, raw SQL, dangerouslySetInnerHTML), CSP + security headers, Stripe webhook signature verification, and framework CVE floors. Reports a scored summary by default; pass --fix for safe low-risk fixes. Use when asked to audit/check/review security, auth, secrets, headers, or OWASP.
disable-model-invocation: true
argument-hint: "[--fix] [--secrets|--auth|--validation|--headers]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
last_verified: 2026-10-21
---

# audit-security

Scan a **Next.js 16 (App Router) + React 19 + Supabase/Clerk + Stripe** app for security gaps against
OWASP Top 10 (2025) and the official Next.js Data Security guidance. Report a **scored** summary.
With `--fix`, apply only low-risk fixes (add `import 'server-only'`, scaffold a baseline security
header set); anything involving key rotation, auth logic, or access control is report-only.

> When to use: "audit security", "check our auth / secrets / headers", "are we OWASP-clean", "review
> for vulnerabilities". Mirrors the `audit-database` report shape for `/full-audit`. Keep the template
> stable. Defers dependency CVEs to `audit-database`'s sibling `audit-dependencies`, monitoring to
> `audit-observability`, DB-internal RLS to `audit-database`.

## Modes

| Invocation | Behaviour |
|---|---|
| `/audit-security` (default) | **Report only.** Run every check, score, output the report. |
| `/audit-security --fix` | Report, then apply auto-fixable checks (add `server-only`, baseline headers). Ask before anything guarded. |
| `--fix --secrets` / `--auth` / `--validation` / `--headers` | Limit fixes to that dimension. |

`--fix` NEVER rotates a key, edits auth logic, changes a CSP that could break the app, or touches
access control without explicit confirmation.

## Procedure

1. **Detect the boundary.** Find `proxy.ts` (Next 16; replaces `middleware.ts`), the Supabase clients
   (server vs admin/`service_role`), `next.config.*`, and how auth resolves (Supabase `getClaims` /
   Clerk). Read `.claude/rules/auth.md` if present — project rules outrank generic advice.
2. **Run the checks** in `references/checks.md` (SEC1-SEC5) by Grep. Platform-only facts (Vercel env
   values, WAF) → `SKIPPED (platform)`, never guessed.
3. **Score** each dimension; compute the overall grade.
4. **Output the report** (template below).
5. **If `--fix`:** apply auto-fixable findings, re-grep to confirm, run `npm run type-check` after
   edits. Report applied vs deferred.

## Scoring

Start each dimension at 100; subtract per finding (CRITICAL -40, HIGH -20, MEDIUM -10, LOW -3,
floor 0). Overall = weighted mean.

| Dim | Weight | Covers |
|---|---|---|
| SEC1 Secrets & client boundary | 25 | NEXT_PUBLIC_ secret leak, service-role in client, `server-only`/DAL, `.env` in git |
| SEC2 Auth & authorization | 25 | re-verify inside actions/handlers, IDOR/ownership, route-handler Origin check, middleware-not-boundary |
| SEC3 Input validation & injection | 20 | Zod at boundaries, raw SQL interpolation, `dangerouslySetInnerHTML` |
| SEC4 Headers & CSP | 15 | CSP + HSTS present, no `unsafe-inline`/`unsafe-eval` |
| SEC5 Webhooks & framework CVEs | 15 | Stripe webhook signature, RSC CVE version floor, CORS |

Grade: A ≥90, B ≥80, C ≥70, D ≥60, F <60.

## Report template (keep stable - the audit pipeline parses this)

```
# Security Audit - <project> - <grade> (<overall>/100)

Mode: report | fix    Stack: <Next vN, Supabase|Clerk, Stripe?>

| Dimension | Score | Findings |
|---|---|---|
| SEC1 Secrets & client boundary    | NN | n |
| SEC2 Auth & authorization         | NN | n |
| SEC3 Input validation & injection | NN | n |
| SEC4 Headers & CSP                | NN | n |
| SEC5 Webhooks & framework CVEs     | NN | n |

## Findings
### [SEVERITY] <id> <title>   (check SEC2a)
- Where: <file:line>
- Evidence: <grep hit>
- Fix: <one line>  •  Auto-fixable: yes/no/guarded
- Applied: yes/no/deferred   (only in --fix mode)

## Skipped
- <SKIPPED (platform) checks>
```

## Rules

- **Never guess.** Platform-side facts (env values, WAF, secret rotation status) are `SKIPPED (platform)`.
- A secret that is or was committed/exposed is CRITICAL even if later removed — flag for rotation.
- Report-only is the default. Auto-fix only checks marked `Yes` in `references/checks.md`.
- Never auto-edit auth logic, access control, key values, or a CSP that could break the running app.
- Match project conventions; `.claude/rules/auth.md` + `database.md` win on conflict.
- Keep the report under ~600 lines; no raw command dumps unless flagging a finding.

## See also
- `references/checks.md` - probe + fix catalogue
- Sibling: `~/.claude/skills/audit-api/` (route-handler/server-action validation overlaps - this skill
  owns secrets/headers/injection; audit-api owns the request/response contract)
