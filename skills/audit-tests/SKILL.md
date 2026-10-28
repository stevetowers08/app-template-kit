---
name: audit-tests
description: Audit a Vitest + Playwright test suite - coverage of critical logic (untested utils/server actions, missing E2E on critical journeys and public routes), test pyramid balance (unit/integration/E2E ratio), mock strategy (mocking the subject, wrong-layer mocks, real DB in unit tests, async Server Components in Vitest), reliability/config (arbitrary waits, coverage thresholds, CI retries, prod-data E2E), and over-testing smells. Reports a scored summary; mostly report-only since writing tests is manual. Use when asked to audit/check/review tests, coverage, flakiness, or the testing strategy.
disable-model-invocation: true
argument-hint: "[--fix] [--config]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
last_verified: 2026-10-21
---

# audit-tests

Scan a **Vitest (unit/integration) + Playwright (E2E)** suite for strategy gaps: coverage of critical
logic, pyramid balance, mock correctness, reliability, and over-testing. Report a **scored** summary.
Almost everything here is **report-only** — writing or repairing a test is judgement work, not a
mechanical fix.

> When to use: "audit our tests", "check coverage / flakiness", "is our testing strategy sound", "are
> the right things tested". Mirrors the `audit-database` report shape for `/full-audit`. Keep the
> template stable.

## Modes

| Invocation | Behaviour |
|---|---|
| `/audit-tests` (default) | **Report only.** Run every check, score, output the report. |
| `/audit-tests --fix --config` | The ONLY fix: scaffold a missing coverage-threshold / CI-retries config block (guarded). No test code is ever auto-written. |

## Procedure

1. **Read the setup.** `vitest.config.*`, `playwright.config.*`, `package.json` test scripts, and
   `TESTING.md` / `.claude/rules`. Honour project conventions (e.g. `vmForks` on Windows where `forks` fails locally, module-level
   Supabase mock, "every util tested", "every public route has an E2E a11y test").
2. **Run the checks** in `references/checks.md` (TST1-TST5) by Grep + file existence.
3. **Score** each dimension; compute the overall grade.
4. **Output the report** (template below). Do NOT run the suite — this is a static audit (note that
   running `npm test` is a separate, user-initiated step).

## Scoring

Start each dimension at 100; subtract per finding (CRITICAL -40, HIGH -20, MEDIUM -10, LOW -3,
floor 0). Overall = weighted mean. Coverage % is a signal, not the score — weight critical-path
coverage over a raw percentage.

| Dim | Weight | Covers |
|---|---|---|
| TST1 Coverage of critical logic | 30 | untested utils, untested server-action logic, missing E2E on critical journeys/public routes |
| TST3 Mock strategy | 25 | mocking the subject, wrong-layer mocks, real DB in unit, async Server Component in Vitest |
| TST2 Pyramid balance | 20 | unit/integration/E2E ratio, inversions |
| TST4 Reliability & config | 15 | arbitrary waits, thresholds, CI retries, prod-data E2E |
| TST5 Over-testing smells | 10 | snapshot spam, framework-binding tests, mock-everything |

Grade: A ≥90, B ≥80, C ≥70, D ≥60, F <60.

## Report template (keep stable - the audit pipeline parses this)

```
# Test Audit - <project> - <grade> (<overall>/100)

Mode: report    Suite: <n unit/integration, n E2E>   Pyramid: U%/I%/E%

| Dimension | Score | Findings |
|---|---|---|
| TST1 Coverage of critical logic | NN | n |
| TST3 Mock strategy              | NN | n |
| TST2 Pyramid balance            | NN | n |
| TST4 Reliability & config       | NN | n |
| TST5 Over-testing smells        | NN | n |

## Findings
### [SEVERITY] <id> <title>   (check TST1a)
- Where: <file | gap, e.g. "src/lib/foo.ts has no test">
- Evidence: <grep/existence result>
- Fix: <one line — usually "add a test for X">
```

## Rules

- **Static only.** Don't run the suite or write test code; report gaps and let the user act.
- A real DB / production data in a test is the highest-severity finding (flaky + data-risk).
- Coverage thresholds are a signal, not the goal — a covered critical path beats a high percentage.
- Honour project test conventions on conflict (`TESTING.md`, `.claude/rules`).
- Keep the report under ~600 lines; report gaps as a list, not per-line dumps.

## See also
- `references/checks.md` - probe + check catalogue
- Sibling: `audit-runtime` (live smoke test in a real browser)
