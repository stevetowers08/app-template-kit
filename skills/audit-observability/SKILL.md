---
name: audit-observability
description: Audit an app's observability setup against 2026 best practices - OpenTelemetry instrumentation (@vercel/otel, instrumentation.ts, runtime guards), error tracking (Sentry per-runtime config, onRequestError, source maps), trace/log correlation (trace_id on logs, context propagation, no double OTel init), log drains (Supabase + Vercel), metrics/RUM (Core Web Vitals, RED, alerts), and cost hygiene (sampling, PII scrubbing, over-instrumentation). Reports a scored summary by default; pass --fix to apply safe, low-risk fixes. Use when asked to audit/check/review observability, monitoring, tracing, logging, Sentry, or telemetry setup.
disable-model-invocation: true
argument-hint: "[--fix] [--instrumentation|--errors|--tracing|--logs|--metrics]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
last_verified: 2026-10-21
---

# audit-observability

Scan a web app (optimised for **Next.js + Supabase + Vercel + Sentry**, but the checks generalise)
for observability gaps against the verified 2026 consensus: **OpenTelemetry as the single
instrumentation standard, three correlated signals (traces, metrics, logs) joined by `trace_id`,
vendor-neutral and per-runtime correct.** Report a **scored** summary. With `--fix`, apply only the
low-risk fixes; anything that ships telemetry to a new destination, touches sampling rates, or
changes runtime config is report-only.

> When to use: "audit our observability / monitoring", "check our Sentry / tracing / logging setup",
> "are we instrumented properly", "review telemetry". Mirrors the `audit-database` report shape so it
> can slot into a `/full-audit`-style pipeline. Keep the report template stable.

## Modes

| Invocation | Behaviour |
|---|---|
| `/audit-observability` (default) | **Report only.** Run every check, score, output the report. Change nothing. |
| `/audit-observability --fix` | Report, then apply **auto-fixable** checks (remove dead `instrumentationHook`, add `NEXT_RUNTIME` guard, add `trace_id` to a logger helper). Ask before anything guarded. |
| `--fix --instrumentation` / `--errors` / `--tracing` / `--logs` / `--metrics` | Limit fixes to that dimension. |

`--fix` NEVER adds a new telemetry destination, changes a sampling ratio, edits a Sentry DSN, or
reconfigures the OTel exporter without explicit confirmation - those affect cost and data egress.

## Procedure

1. **Detect the stack.** Read `package.json` - note presence/version of `@sentry/nextjs`,
   `@vercel/otel`, `@opentelemetry/*`, `web-vitals`. Detect Next.js major version (15/16 vs ≤14 -
   changes the `instrumentationHook` rule). Note Supabase + Vercel from deps/config.
2. **Load project context.** Read any `.claude/rules/*.md`, `AGENTS.md`/`CLAUDE.md` sections on error
   tracking, and existing `instrumentation.ts`, `sentry.*.config.ts`, `next.config.*`. Project rules
   outrank generic advice on conflict.
3. **Run the checks** in `references/checks.md` (O1-O6). Static checks: Grep the repo. Live/config
   checks that need a dashboard (Supabase log drains, Vercel drains, alert rules) can't be verified
   from code - mark them `SKIPPED (dashboard)` and list them under manual actions. Never fabricate.
4. **Score** each dimension and compute the overall grade.
5. **Output the report** (template below).
6. **If `--fix`:** apply auto-fixable findings, re-grep to confirm the finding cleared, report
   applied vs deferred. Run `npm run type-check` (or `tsc --noEmit`) after edits to instrumentation
   or config files.

## Scoring

Each dimension scores 0-100; overall is the weighted mean. Start at 100, subtract per finding by
severity (CRITICAL -40, HIGH -20, MEDIUM -10, LOW -3, floor 0).

| Dim | Weight | Covers |
|---|---|---|
| O1 Instrumentation foundation | 20% | `@vercel/otel` in `instrumentation.ts`, root location, `NEXT_RUNTIME` guard for Node-only SDK, dead `experimental.instrumentationHook` |
| O2 Error tracking | 20% | Sentry installed + per-runtime configs (server/browser/edge separate), `onRequestError`, source maps uploaded, DSN not hardcoded client-side |
| O3 Trace + log correlation | 20% | `trace_id` attached to structured logs, context propagation, no Sentry ⨯ `@vercel/otel` double OTel init (SDK v8+, current v11; v10 still patched) |
| O4 Logs + drains | 15% | structured logger (no `console.log` as observability), Supabase Log Drain configured, Vercel Drains, log levels |
| O5 Metrics + RUM | 15% | Core Web Vitals capture, RED metrics (rate/errors/duration), alerts on latency/error-rate, frontend telemetry |
| O6 Cost + PII hygiene | 10% | trace sampling (~10% head / 100% errors), PII scrubbing before send, no over-instrumentation (<1ms spans, per-log span events), low-cardinality log labels |

Grade: A ≥90, B ≥80, C ≥70, D ≥60, F <60.

## Report template (keep stable - the audit pipeline parses this)

```
# Observability Audit - <project> - <grade> (<overall>/100)

Mode: report | fix    Stack: <Next vN, Sentry?, @vercel/otel?, Supabase?, Vercel?>

| Dimension | Score | Findings |
|---|---|---|
| O1 Instrumentation foundation | NN | n |
| O2 Error tracking             | NN | n |
| O3 Trace + log correlation    | NN | n |
| O4 Logs + drains              | NN | n |
| O5 Metrics + RUM              | NN | n |
| O6 Cost + PII hygiene         | NN | n |

## Findings
### [SEVERITY] <id> <title>   (check O1a)
- Where: <file:line | "dashboard - not in code">
- Evidence: <grep hit | missing file | config value>
- Fix: <one line>  •  Auto-fixable: yes/no/guarded
- Applied: yes/no/deferred   (only in --fix mode)

## Suggested manual actions (dashboard / cost-sensitive - not auto-applied)
- <e.g. add Supabase Log Drain -> Sentry DSN; set trace sampler to 0.1>

## Skipped
- <checks marked SKIPPED (dashboard), if any>
```

## Rules

- **Data accuracy is non-negotiable.** Anything that lives in a dashboard (drains, alerts, sampling
  set via env on the platform) cannot be confirmed from code - report `SKIPPED (dashboard)`, never
  guess that it is or isn't configured.
- Report-only is the default. Auto-fix only the checks marked `Yes` in `references/checks.md`.
- Never auto-add a telemetry destination, change sampling, or edit a DSN/exporter without explicit
  confirmation - these change cost and where user data is sent.
- Per-runtime correctness is a hard rule: Next.js server (Node), browser (V8), and Supabase Edge
  Functions (Deno) are different environments and need separate Sentry configs - flag any that share
  one.
- Match the project's existing conventions; on conflict, the repo's `.claude/rules/*.md` win.
- Keep the report under ~600 lines; no raw command dumps unless flagging a specific finding.

## See also

- `references/checks.md` - the probe + fix catalogue (load this when running)
- Sibling pattern: `~/.claude/skills/audit-database/` (same report shape and scoring model)
