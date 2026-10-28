---
name: audit-production-readiness
description: Audit an app's production/deploy readiness - stack-adaptive across Next.js 16 and React+Vite SPAs (on Vercel). Env hygiene & validation (build-time inlining + secret leak via NEXT_PUBLIC_ / VITE_ prefix, Vercel scopes, fail-fast env schema, .env.example), build & config correctness (next.config / vite.config keys, console.log in prod, case-sensitive imports), caching & runtime correctness (Cache-Control on routes / immutable headers on hashed assets, edge runtime compatibility), and deploy readiness (test-mode keys in prod, error boundaries present, Next middleware→proxy.ts / Vite SPA index.html rewrite + trailingSlash). Reports a scored summary by default; pass --fix for safe low-risk fixes. Use when asked to audit/check/review production readiness, deployment, env vars, or build config.
disable-model-invocation: true
argument-hint: "[--fix] [--config|--logs]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
last_verified: 2026-10-21
---

# audit-production-readiness

Scan an app for deploy/build/runtime-config readiness - **stack-adaptive** across a **Next.js 16** app
and a **React + Vite SPA** (both on Vercel, typically + Stripe/Supabase): env hygiene, build/config
correctness, caching/runtime correctness, and deploy readiness. The categories are universal; the
*targets* differ (`next.config`↔`vite.config`, `NEXT_PUBLIC_`↔`VITE_`, `proxy.ts`↔a `vercel.json` SPA
rewrite). Report a **scored** summary. With `--fix`, apply only mechanical low-risk fixes (rename
config keys, strip `console.log`); key rotation, env schemas, and runtime moves are report-only.

> When to use: "audit production readiness", "are we ready to ship", "check env / build / deploy
> config". Mirrors the `audit-database` report shape for `/full-audit`. Keep the template stable.
> Owns build/config/deploy; defers the secret-in-client *security verdict* to `audit-security`,
> logging/Sentry to `audit-observability`, error-handling quality to `audit-error-handling`, cache
> *performance* to `audit-performance`.

## Modes

| Invocation | Behaviour |
|---|---|
| `/audit-production-readiness` (default) | **Report only.** Run every check, score, output the report. |
| `/audit-production-readiness --fix` | Report, then apply guarded fixes (rename config keys, remove `console.log`). Ask before each. |
| `--fix --config` / `--logs` | Limit fixes to that area. |

`--fix` NEVER rotates a key, writes an env schema, or changes runtime/edge config without confirmation.

## Procedure

1. **Detect the stack FIRST** (Next vs Vite — is there a `next.config.*` or a `vite.config.*`?). For
   Next read major (16 = `proxy.ts`, Turbopack default, `cacheComponents`) + `next.config.*`; for Vite
   read `vite.config.*` + `vercel.json`. Host (Vercel?), `.env*`, `package.json` scripts. Gate the
   Next-only checks (PROD2a/2c, PROD3b/3c, PROD4c) `N/A` on a Vite SPA and run their Vite equivalents
   (PROD2a→vite.config correctness, PROD3a→asset cache headers, PROD4c→SPA `index.html` rewrite) — see
   `references/checks.md`.
2. **Run the checks** in `references/checks.md` (PROD1-PROD4). Platform-side facts (which Vercel scope
   a var is set in, the live webhook secret value) can't be seen from code → `SKIPPED (platform)`,
   never guessed.
3. **Score** each dimension; compute the overall grade.
4. **Output the report** (template below).
5. **If `--fix`:** apply guarded fixes, run `npm run build` (the real check for prod config) +
   `type-check`. Report applied vs deferred.

## Scoring

Start each dimension at 100; subtract per finding (CRITICAL -40, HIGH -20, MEDIUM -10, LOW -3,
floor 0). Overall = weighted mean.

| Dim | Weight | Covers |
|---|---|---|
| PROD1 Env hygiene & validation | 30 | `NEXT_PUBLIC_` / `VITE_` inlining leak, fail-fast env schema, `.env.example`, Vercel scopes |
| PROD2 Build & config correctness | 30 | `next.config` / `vite.config` keys, `console.log` in prod, image defaults (Next), case-sensitive imports |
| PROD3 Caching & runtime correctness | 20 | Cache-Control on routes / immutable headers on hashed assets (SPA), edge runtime API compat (Next), non-serializable props (Next) |
| PROD4 Deploy readiness | 20 | test-mode keys in prod, error boundaries present, `middleware`→`proxy.ts` (Next) / `index.html` rewrite + `trailingSlash:false` (SPA) |

Grade: A ≥90, B ≥80, C ≥70, D ≥60, F <60.

## Report template (keep stable - the audit pipeline parses this)

```
# Production Readiness Audit - <project> - <grade> (<overall>/100)

Mode: report | fix    Stack: <Next 16 | Vite SPA>    Target: <Vercel?, Stripe?>

| Dimension | Score | Findings |
|---|---|---|
| PROD1 Env hygiene & validation     | NN | n |
| PROD2 Build & config correctness   | NN | n |
| PROD3 Caching & runtime correctness| NN | n |
| PROD4 Deploy readiness             | NN | n |

## Findings
### [SEVERITY] <id> <title>   (check PROD2a)
- Where: <file:line | config key>
- Evidence: <grep hit | missing file>
- Fix: <one line>  •  Auto-fixable: yes/no/guarded
- Applied: yes/no/deferred   (only in --fix mode)

## Skipped
- <SKIPPED (platform) checks — e.g. Vercel env scope, live webhook secret>
```

## Rules

- **Never guess platform facts.** Which Vercel scope a var is set in, or the live secret's value, is
  `SKIPPED (platform)`.
- **Stack-adaptive.** Detect Next vs Vite first; the four categories are universal but the targets
  differ. Mark Next-only checks (removed `next.config` keys, image defaults, edge runtime, RSC
  serialization, `proxy.ts`) `N/A` on a Vite SPA and run the Vite equivalents (`vite.config`/`VITE_`
  leak, `vercel.json` SPA rewrite, hashed-asset cache headers). Never flag a missing `next.config` on a
  Vite app.
- Report-only is the default. Auto-fix only the guarded checks in `references/checks.md`.
- Never rotate keys, write env schemas, or change edge/runtime config without confirmation.
- `npm run build` is the real production check — run it after `--fix`.
- Keep the report under ~600 lines; no raw command dumps unless flagging a finding.

## See also
- `references/checks.md` - probe + fix catalogue
- Siblings: `audit-security` (secret verdict), `audit-observability` (logging/Sentry),
  `audit-error-handling` (error boundaries), `audit-performance` (cache perf)
