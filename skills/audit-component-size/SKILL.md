---
name: audit-component-size
description: Audit a codebase for oversized, over-complex components - and the files, functions, and nesting behind them - against the project's code-style thresholds (functions <=50 lines, files 200-400/800 max, components ~200-300, nesting <=4). Reports a scored summary of what's too big and should be split; --fix runs a disciplined one-area-at-a-time refactor (checkpoint -> extract -> validate -> document the convention). Use whenever the user wants to find big/bloated components or files, check function/file length, refactor oversized code, or improve modularity - even if they don't say "audit".
disable-model-invocation: true
argument-hint: "[--fix]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
last_verified: 2026-08-21
---

# audit-component-size

Scan for oversized/over-complex code - components, files, functions, nesting - against the project's
code-style limits, and report what should be split. With `--fix`, refactor **one focused area at a
time** with a checkpoint + validation + convention-doc discipline (never a bulk auto-rewrite).

> When to use: "find big/bloated components", "this file is too long", "check function/file size",
> "refactor oversized code", "improve modularity". Mirrors the `audit-database` report shape for
> `/full-audit`. Keep the template stable. Owns **size/length/complexity** only - defers duplicate
> components + style drift to `audit-design-system`, dead/orphaned files to `check-cleanup`, file/folder
> placement to `audit-architecture`, and per-diff reuse cleanup to the built-in `/simplify`.

## Modes

| Invocation | Behaviour |
|---|---|
| `/audit-component-size` (default) | **Report only.** Find oversized code, score, output. Change nothing. |
| `/audit-component-size --fix` | Report, then refactor **one area at a time** via the disciplined process (checkpoint → extract → validate → document). Confirm each area; never bulk-rewrite. |

## Procedure

1. **Load thresholds** from the repo's own rules if it states any; otherwise use the defaults
   below (functions 50 lines, files 200-400 typical and 800 max, nesting 4 levels). Detect generated files to exclude (`*.d.ts`, generated `types`, schema dumps).
2. **Run the checks** in `references/checks.md` (CS1-CS4) by `wc -l` + Grep, reading each flagged
   site to confirm it genuinely does too much (a 250-line file of pure constants isn't a finding).
3. **Score** each dimension; compute the overall grade.
4. **Output the report** (template below), each finding with a suggested split.
5. **If `--fix`:** pick ONE area, checkpoint git, extract the smallest pieces preserving every public
   interface, validate (`tsc`/`eslint`/`test`), document the standardised pattern in the relevant
   `CLAUDE.md`. One area per session; no gold-plating; flag before adding any new abstraction.

## Scoring

Start each dimension at 100; subtract per finding (CRITICAL -40, HIGH -20, MEDIUM -10, LOW -3,
floor 0). Overall = weighted mean. Thresholds (project code-style): functions ≤50, files 200-400 / 800
max, components ~200-300, nesting ≤4.

| Dim | Weight | Covers |
|---|---|---|
| CS1 Function / hook size | 30 | functions > ~50 lines doing more than one thing → extract helpers, early returns |
| CS2 File size | 30 | files > 400 (warn) / > 800 (HIGH) → split by responsibility |
| CS3 Component size | 25 | components > ~200-300 lines → extract subcomponents + `use*` hooks |
| CS4 Nesting & complexity | 15 | nesting > 4 levels, long param lists, giant switch/if ladders |

Weights sum to 100. Grade: A ≥90, B ≥80, C ≥70, D ≥60, F <60.

## Report template (keep stable - the audit pipeline parses this)

```
# Component Size Audit - <project> - <grade> (<overall>/100)

Mode: report | fix    Thresholds: fn ≤50 · file 400/800 · component ~250 · nesting ≤4

| Dimension | Score | Findings |
|---|---|---|
| CS1 Function / hook size | NN | n |
| CS2 File size            | NN | n |
| CS3 Component size       | NN | n |
| CS4 Nesting & complexity | NN | n |

## Findings (worst first)
### [SEVERITY] <id> <title>   (check CS3)
- Where: <file:line> — <N lines>
- Evidence: <wc / grep result>
- Fix: <suggested split — e.g. extract <X> subcomponent + a use<Y> hook>  •  via --fix one-area refactor
- Applied: yes/no/deferred   (only in --fix mode)
```

## Rules

- **Size, not duplication.** Duplicate components/style → `audit-design-system`; dead code →
  `check-cleanup`; placement → `audit-architecture`. Don't re-report those here.
- **Read before flagging** - a long file of pure constants/types isn't bloat; a 60-line function doing
  one clear thing may be fine. Confirm it does too much.
- **`--fix` is a disciplined refactor, never a bulk rewrite** - one area, checkpoint, preserve every
  public interface + behaviour, validate, document the convention to stop recurrence.
- Honour the repo's own thresholds over the defaults.
- Keep the report under ~600 lines; report the worst offenders, not every file's line count.

## See also
- `references/checks.md` - probe catalogue + the refactor process
- `/simplify` (built-in) - per-diff reuse/efficiency cleanup (this skill is the project-wide size audit)
- Siblings: `audit-design-system` (duplication), `audit-architecture` (placement), `check-cleanup` (dead code)
