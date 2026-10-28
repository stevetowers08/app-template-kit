---
name: audit-typescript
description: Audit a TypeScript project's type safety - compiler strictness (strict + noUncheckedIndexedAccess, exactOptionalPropertyTypes, isolatedModules, verbatimModuleSyntax), escape hatches (any, as unknown as T, @ts-ignore vs @ts-expect-error, non-null !), runtime boundaries (Zod validation of external data, unknown catch variables), and API surface types (explicit return types, import type). Reports a scored summary by default; pass --fix for safe low-risk fixes. Use when asked to audit/check/review TypeScript, strictness, any usage, tsconfig, or type safety.
disable-model-invocation: true
argument-hint: "[--fix] [--config|--any|--boundaries]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
last_verified: 2026-10-21
---

# audit-typescript

Scan a TS project for type-safety gaps: compiler strictness, escape hatches, runtime boundaries, and
exported API types. Report a **scored** summary. With `--fix`, apply only mechanical low-risk fixes
(enable a flag, `@ts-ignore`→`@ts-expect-error`, value→`import type`); narrowing `any` and adding
schemas are report-only.

> When to use: "audit TypeScript", "are we strict enough", "find `any` usage", "check tsconfig".
> Mirrors the `audit-database` report shape for `/full-audit`. Keep the template stable. Owns type
> safety/config; the Zod-at-the-boundary checks overlap `audit-api` (request contract) — here it is
> the type-trust angle.

## Modes

| Invocation | Behaviour |
|---|---|
| `/audit-typescript` (default) | **Report only.** Run every check, score, output the report. |
| `/audit-typescript --fix` | Report, then apply guarded fixes; then run `tsc --noEmit` and report any errors enabling a flag surfaced (those are NOT auto-fixed). |
| `--fix --config` / `--any` / `--boundaries` | Limit fixes to that dimension. |

`--fix` NEVER narrows an `any`, rewrites a cast, or removes a `!` for you — those change behaviour.

## Procedure

1. **Read the merged tsconfig** (follow every `extends`). The effective `compilerOptions` are the
   source of truth for TS1 — don't infer from one file.
2. **Run the checks** in `references/checks.md` (TS1-TS4): TS1 from config, the rest by Grep over
   `src`/`app`. Read `.claude/rules/code-style.md` for project conventions (e.g. explicit return types).
3. **Score** each dimension; compute the overall grade.
4. **Output the report** (template below).
5. **If `--fix`:** apply guarded fixes, run `npm run type-check`. If enabling a strict flag surfaced
   real type errors, list them under "Surfaced by fix (manual)" — never auto-`any` them away.

## Scoring

Start each dimension at 100; subtract per finding (CRITICAL -40, HIGH -20, MEDIUM -10, LOW -3,
floor 0). Overall = weighted mean. (`any`/cast counts can be large — cap the subtraction at the
floor and report the count, don't let one dimension dominate the whole grade.)

| Dim | Weight | Covers |
|---|---|---|
| TS1 Compiler strictness | 35 | strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, isolatedModules, verbatimModuleSyntax |
| TS2 Escape hatches | 30 | `any`, `as unknown as T`, `@ts-ignore`, non-null `!` |
| TS3 Runtime boundaries | 20 | Zod validation of external data, `unknown` catch variables |
| TS4 API surface types | 15 | explicit return types on exports, `import type` |

Grade: A ≥90, B ≥80, C ≥70, D ≥60, F <60.

## Report template (keep stable - the audit pipeline parses this)

```
# TypeScript Audit - <project> - <grade> (<overall>/100)

Mode: report | fix    Config: <strict on/off, key flags>

| Dimension | Score | Findings |
|---|---|---|
| TS1 Compiler strictness | NN | n |
| TS2 Escape hatches      | NN | n (count: N anys, N casts) |
| TS3 Runtime boundaries  | NN | n |
| TS4 API surface types   | NN | n |

## Findings
### [SEVERITY] <id> <title>   (check TS2a)
- Where: <file:line | tsconfig flag>
- Evidence: <grep hit | flag value>
- Fix: <one line>  •  Auto-fixable: yes/no/guarded
- Applied: yes/no/deferred   (only in --fix mode)

## Surfaced by fix (manual)
- <real type errors revealed by enabling a strict flag — do NOT silence with any>
```

## Rules

- The **merged** tsconfig is the source of truth for TS1; follow `extends`.
- Report-only is the default. Auto-fix only the guarded checks in `references/checks.md`.
- Never silence a newly-surfaced strict error with `any`/`@ts-ignore` — report it for a real fix.
- An `any` with a documented `eslint-disable` + reason is acceptable — note it, don't fail it.
- Keep the report under ~600 lines; report counts, not every single `any` line, when there are many.

## See also
- `references/checks.md` - probe + fix catalogue
- Siblings: `audit-api` (request validation), `audit-error-handling` (catch handling)
