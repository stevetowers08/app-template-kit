# audit-database — check catalogue

The probes each check runs, what a finding looks like, and the fix. Keep in sync with the Obsidian
note `Database/Supabase Postgres.md`, your
`postgresql-table-design` skill (D7), and the project's `.claude/rules/database.md` (D5).

## Data sources (in priority order)

1. **Supabase advisors (the spine)** — `get_advisors('performance')` AND `get_advisors('security')`.
   These are the splinter lints Supabase Studio runs (~29 checks). Run BOTH every time; they are the
   highest-signal source and map directly to most dimensions below.
2. **Live SQL diagnostics** — `execute_sql` with **read-only `SELECT`s** against `pg_stat_statements`,
   `pg_stat_user_tables`, `pg_stat_user_indexes`, `pg_policy`, `pg_indexes`, `information_schema`.
3. **Service logs** — `get_logs('postgres')` (+ `api`/`auth` when relevant) for real errors/warnings
   the DB emitted in the last 24h.
4. **Inventory** — `list_tables`, `list_extensions`, `list_migrations`, `generate_typescript_types`.
5. **Static code** — Grep over `supabase/migrations/`, `src/hooks/`, `src/features/*/hooks/`,
   `supabase/functions/` — used when the MCP is unavailable, and to catch issues *before they ship*.

**Read-only:** every `execute_sql` here is a `SELECT`/diagnostic. Never run DML/DDL during an audit.
If the MCP is unavailable, run the static checks and mark each live check `SKIPPED (no MCP)` — never
guess a live result.

## Contents

- D1 RLS performance · D2 Indexes · D3 Query shape & slow queries · D4 Function security
- D5 Project-convention rules · D6 Schema hygiene & maintenance · D7 Schema design quality
- D8 Migration safety · Advisor lint → dimension map

---

## D1. RLS policy performance

### D1a. Unwrapped auth helpers — splinter lint 0003
`auth.uid()` / `auth.jwt()` called per-row instead of `(select auth.uid())` (runs once per statement).
Live: `get_advisors('performance')`, name `auth_rls_initplan`.
Static: `grep -rnE '(using|with check)\s*\(\s*auth\.(uid|jwt)\(\)' supabase/migrations` — a match
WITHOUT a surrounding `(select ...)` is a finding.
Fix: wrap the call. Safe to auto-apply (no behaviour change).

### D1b. Multiple permissive policies — splinter lint 0006
N permissive policies for the same `{role, action}` → up to N checks per row.
Live: `get_advisors('performance')`, name `multiple_permissive_policies`.
Fix: consolidate into one `OR` policy. **NOT auto-fixed** (merging changes access logic). Propose +
require `--fix --rls` + confirmation. Skip if the merge becomes unreadable.

### D1c. Unindexed policy columns
A column used in a USING/WITH CHECK clause with no btree index — RLS falls off the index at scale.
Live:
```sql
select polrelid::regclass as tbl, polname, pg_get_expr(polqual, polrelid) as using_expr
from pg_policy order by 1;   -- cross-check referenced columns against pg_indexes
```
Fix: `create index concurrently <tbl>_<col>_idx on <tbl> (<col>);` — low risk, auto-fixable.

---

## D2. Indexes

### D2a. Unindexed foreign keys — splinter lint 0001
Live: `get_advisors('performance')`, name `unindexed_foreign_keys`.
Static: `grep -rnE 'references\s+\w+' supabase/migrations` — cross-check each FK col has an index.
Fix: `create index concurrently <tbl>_<col>_idx on <tbl> (<col>);` — auto-fixable (migration). Low risk.

### D2b. Unused indexes — splinter lint 0005
Live: `get_advisors('performance')` name `unused_index`, AND:
```sql
select schemaname, relname, indexrelname, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) as size
from pg_stat_user_indexes
where idx_scan = 0 and not indisprimary and not indisunique
order by pg_relation_size(indexrelid) desc;
```
Fix: **NEVER auto-drop** — `idx_scan` resets on restart, needs 2-4 weeks of real load; exclude
unique/PK and rare-event (reporting) indexes. Report only; emit `drop index concurrently ...` as a
*suggested manual* block.

### D2c. Duplicate indexes — splinter lint 0009
A standalone `(a)` made redundant by a composite `(a, b)`.
Live: `get_advisors('performance')`, name `duplicate_index`.
Fix: report; auto-drop only the confirmed-redundant non-unique standalone under `--fix --indexes`.

### D2d. Missing indexes — seq-scan heavy tables
The "should-exist" gap advisors don't flag. A large, frequently-filtered table doing mostly seq scans.
```sql
select schemaname, relname,
       seq_scan, idx_scan,
       round(seq_scan*100.0/nullif(seq_scan+idx_scan,0),1) as seq_pct,
       pg_size_pretty(pg_relation_size(relid)) as size, n_live_tup
from pg_stat_user_tables
where seq_scan > 100 and pg_relation_size(relid) > 10*1024*1024  -- >10MB
order by seq_tup_read desc limit 20;
```
`seq_pct > 90%` on a large, hot table = likely missing index. Fix: confirm with `EXPLAIN ANALYZE`,
then `CREATE INDEX CONCURRENTLY` on the filtered column. **Report** (which column needs it is a
judgement call).

### D2e. Wrong index type / no covering index
- jsonb/array/full-text columns queried with `@>`/`?`/`@@` but indexed with btree (or not at all) →
  need **GIN**; ranges/geometry → **GiST**; very large naturally-ordered (time-series) → **BRIN**.
- Hot read paths that fetch a couple of extra columns → consider a **covering** index
  (`... INCLUDE (col)`) for index-only scans.
Detect via `list_tables` column types cross-referenced with query patterns; report candidates. Advisory.

---

## D3. Query shape & slow queries

### D3a. N+1 / non-inlinable computed relationship — static
```
grep -rnE 'for\s*\(.*\)\s*\{[^}]*\.from\(' src        -- query inside a loop = N+1 smell
grep -rn  'returns ' supabase/migrations | grep -iE 'returns\s+\w+\s*$'  -- non-SETOF computed rel (not inlinable)
```
Advisory — report file:line + pattern. Never auto-rewrite query logic.

### D3b. Slow / hot queries — `pg_stat_statements`
The single most useful performance view (enable it if absent). Start with cumulative time, not
single-query latency — a fast query run a million times costs more than a slow one run once.
```sql
select calls, round(total_exec_time::numeric,1) as total_ms,
       round(mean_exec_time::numeric,2) as mean_ms,
       round(stddev_exec_time::numeric,2) as stddev_ms,
       query
from pg_stat_statements order by total_exec_time desc limit 15;
```
Flag: highest `total_ms` (optimisation targets); high `stddev_ms` relative to `mean_ms` (pathological
plan variance, often a missing index on a filtered column). Report; pair the worst with `EXPLAIN
ANALYZE`. If the extension isn't installed, mark `SKIPPED (no pg_stat_statements)`.

---

## D4. RPC / function security

### D4a. Mutable search_path — splinter lint 0011
`security definer` (or any) function without `set search_path = ''`.
Live: `get_advisors('security')`, name `function_search_path_mutable`.
Static: `grep -rniE 'create (or replace )?function' supabase/migrations` — each needs `set search_path = ''`.
Fix: add the clause + schema-qualify body refs. **Semi-auto** (unqualified refs then break) — review
under `--fix --functions`.

### D4b. Exposed executable definer functions — lints 0028/0029
`security definer` functions in an API-exposed schema executable by anon/authenticated.
Live: `get_advisors('security')`, names `*_security_definer_function_executable`.
Fix: move to a `private` schema + `revoke execute ... from anon, authenticated`. Report only.

### D4c. Security-definer view — lint 0010
A view that runs as its owner (bypasses caller RLS) instead of `security_invoker = true`.
Live: `get_advisors('security')`, name `security_definer_view`. Fix: `alter view ... set
(security_invoker = true)` (PG15+) or revoke anon/authenticated access. Report.

---

## D5. Project-convention rules — read `.claude/rules/database.md`

Project-specific; load the repo's rules and enforce them. For one production app:

### D5a. org_id FK must be ON DELETE CASCADE
`grep -rnE 'org_id[^,]*references\s+orgs' supabase/migrations` — any `RESTRICT`/`NO ACTION`/omitted
rule breaks `admin-delete-org` cascade. Fix: `ON DELETE CASCADE`; apply under `--fix` (hard project rule).

### D5b. Deletion-blocking triggers need an org-cascade escape
Any `before delete` trigger that `raise`s must contain
`IF NOT EXISTS (SELECT 1 FROM orgs WHERE id = OLD.org_id) THEN RETURN OLD; END IF;`.
Reference: `check_stage_not_protected` on `pipeline_stages`. Report only (logic-sensitive).

---

## D6. Schema hygiene & maintenance

### D6a. Advisor hygiene lints (report straight from `get_advisors`)
- 0004 no_primary_key · 0008 rls_enabled_no_policy · 0013 rls_disabled_in_public ·
  0002 auth_users_exposed · 0014 extension_in_public · 0015 rls_references_user_metadata ·
  0016 materialized_view_in_api · 0021 fkey_to_auth_unique.
Report each (most are access-control- or correctness-sensitive — do not auto-fix).

### D6b. Table bloat / dead tuples — lint 0020 + live
Live advisor: `table_bloat`. Plus:
```sql
select schemaname, relname, n_live_tup, n_dead_tup,
       round(n_dead_tup::numeric/nullif(n_live_tup+n_dead_tup,0)*100,1) as dead_pct,
       last_autovacuum, last_autoanalyze
from pg_stat_user_tables where n_live_tup > 1000 order by dead_pct desc nulls last;
```
`dead_pct > 20%` or a stale `last_autovacuum` = autovacuum falling behind. Report (vacuum/tuning is
ops, not a code fix).

### D6c. Stale planner stats
```sql
select relname, n_mod_since_analyze, last_autoanalyze
from pg_stat_user_tables
where n_mod_since_analyze > greatest(1000, n_live_tup*0.1) order by n_mod_since_analyze desc;
```
Heavy modifications since last analyze → planner mis-estimates. Fix: `ANALYZE <table>;` (safe). Report.

### D6d. Outdated / mislocated extensions
`list_extensions` — flag extensions with a newer version (lint 0022 `extension_versions_outdated`) and
any installed into `public` (lint 0014). Report.

### D6e. Real DB warnings/errors — `get_logs('postgres')`
Pull the last 24h. Surface recurring `ERROR`/`WARNING`/`FATAL` lines (deadlocks, statement timeouts,
permission denied, OOM). Cross-reference with the dimensions above. Report a short list; mark
`SKIPPED (no logs)` if unavailable.

### D6f. Schema ↔ generated-types drift
`generate_typescript_types` and diff against the committed types file
(`src/integrations/supabase/types.ts`). A diff = the schema changed without regenerating types.
Fix: regenerate + commit. Report (don't auto-overwrite; it may be mid-change).

---

## D7. Schema design quality (from `postgresql-table-design`)

Catches bad table design — wrong types, missing constraints — that the perf/security lints miss.
Detect via `list_tables` (live column types) and/or static grep of `CREATE TABLE` in migrations.

### D7a. Wrong data type — HIGH/MEDIUM
| Anti-pattern | Use instead | Why |
|---|---|---|
| `timestamp` (no tz) | `timestamptz` | timezone bugs (the hydration date bug class) |
| `varchar(n)` / `char(n)` | `text` (+ `CHECK (length(col) <= n)` if a limit is real) | arbitrary limits, padding |
| `money` or float for currency | `numeric(p,s)` | float rounding on money |
| `serial` | `generated always as identity` | serial has ownership/permission footguns |
| `timetz`, `timestamptz(0)`/any precision | `timestamptz` | discouraged / lossy |
```
grep -rniE '\b(timestamp\b(?!tz)|varchar\(|char\(|\bmoney\b|\bserial\b|timetz|timestamptz\([0-9])' supabase/migrations
```
Fix: report with the correct type. **Not auto-fixed on existing columns** (a type change rewrites the
table) — propose for new tables / the next migration.

### D7b. Missing integrity constraints — MEDIUM
- A status/enum-like `text` column with no `CHECK (col in (...))` or lookup FK.
- A money/quantity column without `NOT NULL CHECK (col >= 0)` (CHECK alone passes NULLs — pair with NOT NULL).
- A natural-unique column (email, slug) without `UNIQUE` (consider `NULLS NOT DISTINCT`, PG15+).
Detect via `list_tables`/migration grep; report candidates (adding constraints to live data needs care).

### D7c. PK strategy — LOW/MEDIUM
Reference tables should have a PK; prefer `bigint generated always as identity`, or `uuid` (v7) only
when global/opaque IDs are needed. Flag `serial` PKs (→ identity) and event/log tables that arguably
need no PK. Cross-ref D6a (lint 0004). Report.

### D7d. Identifiers — LOW
Quoted/mixed-case identifiers; convention is `snake_case`. `grep -rnE 'create table\s+"' supabase/migrations`.
Report.

---

## D8. Migration safety

Dangerous DDL that locks or rewrites tables on deploy. Static grep of `supabase/migrations/`.

### D8a. NOT NULL column with a volatile default — HIGH
```
grep -rniE 'add column .* not null .* default (now\(\)|gen_random_uuid\(\)|clock_timestamp\(\))' supabase/migrations
```
A volatile default rewrites the **entire table** and holds a lock — can freeze a large table on
deploy. Fix: add nullable + backfill in batches, then set NOT NULL; or use a non-volatile default.
Report.

### D8b. Index built without CONCURRENTLY — MEDIUM
```
grep -rniE 'create (unique )?index ' supabase/migrations | grep -viE 'concurrently'
```
A plain `CREATE INDEX` locks the table against writes while it builds. Fix: `CREATE INDEX
CONCURRENTLY` (note: can't run inside a txn; leaves an INVALID index on failure to drop). Report
(only material on large/hot tables).

### D8c. Function overload trap — LOW
`create or replace function` with changed argument signature creates an **overload**, not a
replacement — the old version lingers and may still be callable from the API.
Fix: `drop function <old sig>` first when you intend a replacement. Report.

### D8d. Single-argument `to_tsvector`/`to_tsquery` — LOW
```
grep -rnE 'to_ts(vector|query)\(' supabase/migrations src | grep -vE "to_ts(vector|query)\('"
```
Missing the language arg makes FTS depend on `default_text_search_config` and breaks index matching.
Fix: always `to_tsvector('english', col)`. Report.

---

## Advisor lint → dimension map

| Lint | Dim | Auto-fix? |
|---|---|---|
| 0001 unindexed_foreign_keys | D2a | Yes |
| 0002 auth_users_exposed | D6a | No |
| 0003 auth_rls_initplan | D1a | Yes |
| 0004 no_primary_key | D6a/D7c | No |
| 0005 unused_index | D2b | No (report) |
| 0006 multiple_permissive_policies | D1b | No (propose + confirm) |
| 0008 rls_enabled_no_policy | D6a | No |
| 0009 duplicate_index | D2c | Guarded |
| 0010 security_definer_view | D4c | No |
| 0011 function_search_path_mutable | D4a | Semi |
| 0013 rls_disabled_in_public | D6a | No |
| 0014 extension_in_public | D6a/D6d | No |
| 0015 rls_references_user_metadata | D6a | No |
| 0016 materialized_view_in_api | D6a | No |
| 0020 table_bloat | D6b | No |
| 0021 fkey_to_auth_unique | D6a | No |
| 0022 extension_versions_outdated | D6d | No |
| 0028/0029 *_security_definer_function_executable | D4b | No |
