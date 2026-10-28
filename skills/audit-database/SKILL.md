---
name: audit-database
description: Audit a Supabase/Postgres database for performance, security, schema-design and migration-safety issues. Runs the Supabase advisors (security + performance) as the spine, plus live diagnostics (pg_stat_statements slow queries, seq-scan/missing indexes, table bloat, stale stats), Postgres logs, extension and schema-vs-types drift checks - then RLS tuning, FK/unused/duplicate indexes, function search_path, schema design (data types, constraints, PK strategy), and project rules. Reports a scored summary by default; pass --fix for safe low-risk fixes. Use whenever the user wants to audit/check/review the database or schema, find slow queries, harden RLS, check indexes, review Supabase advisor warnings, or look at Postgres logs - even if they don't say "audit".
disable-model-invocation: true
argument-hint: "[--fix] [--rls|--indexes|--functions|--schema]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write, mcp__supabase__get_advisors, mcp__supabase__execute_sql, mcp__supabase__get_logs, mcp__supabase__list_tables, mcp__supabase__list_extensions, mcp__supabase__list_migrations, mcp__supabase__generate_typescript_types, mcp__supabase__apply_migration
last_verified: 2026-08-21
---

# audit-database

Scan a Supabase/Postgres project for the anti-patterns in
[[Supabase Postgres]] (Obsidian, `Wiki/`) plus
the project's own `.claude/rules/database.md`, and report a **scored** summary. With `--fix`, apply
only the low-risk fixes; everything access-control- or data-loss-sensitive is report-only.

> When to use: "audit the database", "check our RLS / indexes", "find slow queries", "is the schema
> set up right". Keep the report template below stable so audit reports stay consistent across skills.

## Modes

| Invocation | Behaviour |
|---|---|
| `/audit-database` (default) | **Report only.** Run every check, score, output the report. Change nothing. |
| `/audit-database --fix` | Report, then apply the **auto-fixable** checks (FK indexes, wrap `auth.uid()`, org_id CASCADE). Ask before anything guarded. |
| `/audit-database --fix --rls` / `--indexes` / `--functions` | Limit fixes to that dimension. |

`--fix` NEVER drops an index, merges an RLS policy, or rewrites query logic without explicit
confirmation. See the auto-fix column in `references/checks.md`.

## Procedure

1. **Pull the live signals first (the spine).** Run BOTH `get_advisors('performance')` and
   `get_advisors('security')` — these are the highest-signal source and map to most dimensions. Then
   gather the rest of the live data from `references/checks.md`: the `execute_sql` read-only
   diagnostics (pg_stat_statements, seq scans, bloat, stale stats), `get_logs('postgres')`,
   `list_extensions`, and a `generate_typescript_types` drift diff. If the Supabase MCP is genuinely
   unavailable, do the **static** checks only and mark every live check `SKIPPED (no MCP)`. Never
   fabricate a live result. (Every `execute_sql` is a read-only `SELECT` — never DML/DDL in an audit.)
2. **Load project rules.** Read `.claude/rules/database.md` and enforce whatever it states (D5).
   Hard rules; they outrank generic advice on conflict.
3. **Run the checks** in `references/checks.md` (D1-D8), mapping each advisor lint via the table at the
   end of that file. Static checks Grep `supabase/migrations/`, `src/hooks/`, `src/features/*/hooks/`,
   `supabase/functions/` — these also catch issues before they ship.
4. **Score** each dimension (below) and compute the overall grade.
5. **Output the report** (template below).
6. **If `--fix`:** apply auto-fixable findings. For DDL, write a migration to
   `supabase/migrations/<timestamp>_audit_fix_<desc>.sql` then apply it with
   `mcp__supabase__apply_migration` (per the project's migration rule). Re-run the relevant check to
   confirm the finding cleared. Report what was applied vs deferred.

## Scoring

Each dimension scores 0-100; overall is the weighted mean. Start at 100, subtract per finding by
severity (CRITICAL -40, HIGH -20, MEDIUM -10, LOW -3, floor 0).

| Dim | Weight | Covers |
|---|---|---|
| D1 RLS performance | 18 | unwrapped auth helpers, multiple permissive policies, unindexed policy cols |
| D2 Indexes | 16 | unindexed FKs, unused, duplicate, missing (seq-scan), wrong type / covering |
| D7 Schema design quality | 16 | data types, integrity constraints, PK strategy, identifiers |
| D4 Function security | 12 | mutable search_path, exposed definer fns, security-definer view |
| D5 Project rules | 12 | org_id CASCADE, trigger cascade-escape |
| D3 Query shape & slow queries | 10 | N+1, non-SETOF computed rels, pg_stat_statements hot/slow queries |
| D6 Schema hygiene & maintenance | 10 | PK/RLS advisor lints, bloat/dead tuples, stale stats, extensions, logs, types drift |
| D8 Migration safety | 6 | volatile-default rewrite, non-concurrent index, overload, single-arg tsvector |

Weights sum to 100. Grade: A ≥90, B ≥80, C ≥70, D ≥60, F <60.

## Report template (keep stable — the audit pipeline parses this)

```
# Database Audit — <project> — <grade> (<overall>/100)

Mode: report | fix    DB: live (advisors+SQL+logs) | static-only

| Dimension | Score | Findings |
|---|---|---|
| D1 RLS performance              | NN | n |
| D2 Indexes                      | NN | n |
| D7 Schema design quality        | NN | n |
| D4 Function security            | NN | n |
| D5 Project rules                | NN | n |
| D3 Query shape & slow queries   | NN | n |
| D6 Schema hygiene & maintenance | NN | n |
| D8 Migration safety             | NN | n |

## Findings
### [SEVERITY] <id> <title>   (check D1a)
- Where: <table.column | file:line>
- Evidence: <advisor lint | SQL probe result | log line | grep hit>
- Fix: <one line>  •  Auto-fixable: yes/no/guarded
- Applied: yes/no/deferred   (only in --fix mode)

## Suggested manual actions (not auto-applied)
- <e.g. drop-unused-index block after 2-4wk load check; ANALYZE stale tables; regenerate types>

## Skipped
- <checks marked SKIPPED (no MCP / no pg_stat_statements / no logs), if any>
```

## Rules

- **Data accuracy is non-negotiable.** Unknown = report `SKIPPED`, never guess.
- Report-only is the default. Auto-fix only the checks marked `Yes` in `references/checks.md`.
- Never auto-drop an index, merge a policy, alter access control, or rewrite query logic without
  explicit confirmation — these can cause data exposure or loss.
- One migration file per fix dimension; apply immediately (project migration rule); re-verify.
- Match the project's existing conventions; on conflict, the repo's `.claude/rules/database.md` wins.
- Keep the report under ~600 lines; no raw command dumps unless flagging a specific finding.

## See also

- `references/checks.md` — the probe + fix catalogue (load this when running)
- Obsidian: `Database/Supabase Postgres.md`
