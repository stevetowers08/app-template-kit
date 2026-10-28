---
name: audit-error-handling
description: Audit an app's error-handling robustness - swallowed/silent errors (empty or log-and-continue catches, discarded Supabase {error}), React error boundaries (route-segment error.tsx, global-error.tsx, Sentry capture), async/promise safety (floating promises, Promise.all vs allSettled), error typing & propagation (unknown catch narrowing, throwing non-Error), resilience (retry/timeout/circuit-breaker on transient calls, graceful degradation), and user-facing error UX (mutation onError, no raw error.message to users). Reports a scored summary by default; pass --fix for the few safe fixes. Use when asked to audit/check/review error handling, reliability, swallowed errors, or resilience.
disable-model-invocation: true
argument-hint: "[--fix] [--typing]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
last_verified: 2026-10-21
---

# audit-error-handling

Scan a **Next.js 16 + React 19 + TypeScript + Supabase** app for error-handling weaknesses. Applies
the `error-handling-patterns` principles (recoverable vs unrecoverable, surface-don't-swallow,
retry/circuit-breaker, graceful degradation) as concrete checks. Report a **scored** summary. With
`--fix`, apply only the one safe mechanical fix (`throw 'str'` → `throw new Error(...)`); adding
handlers, boundaries, or retries is report-only (they change control flow — judgement calls).

> When to use: "audit error handling", "are we swallowing errors", "check our reliability /
> resilience", "do failures surface". Mirrors the `audit-database` report shape for `/full-audit`.
> Keep the template stable. Owns the *handling/propagation pattern*; defers HTTP error-response shape
> to `audit-api`, the error-tracker setup to `audit-observability`, loading/empty states to
> `audit-loading-animations`, catch-variable typing to `audit-typescript`.

## Modes

| Invocation | Behaviour |
|---|---|
| `/audit-error-handling` (default) | **Report only.** Run every check, score, output the report. |
| `/audit-error-handling --fix --typing` | The only fix: wrap `throw '<string>'` in `new Error(...)`. Everything else stays report-only. |

`--fix` NEVER adds a catch handler, retry, boundary, or `onError` for you — handling logic is a
judgement call you must make.

## Procedure

1. **Detect the stack.** Error tracker (Sentry?), Supabase usage, TanStack Query (mutations),
   `useUnknownInCatchVariables` (is catch `unknown`?). Read `.claude/rules` for project conventions.
2. **Run the checks** in `references/checks.md` (EH1-EH6) by Grep, reading flagged sites to confirm (a
   catch that genuinely recovers is fine; only swallow-and-continue is a finding).
3. **Score** each dimension; compute the overall grade.
4. **Output the report** (template below).
5. **If `--fix --typing`:** wrap thrown strings, run `npm run type-check`. Report applied vs deferred.

## Scoring

Start each dimension at 100; subtract per finding (CRITICAL -40, HIGH -20, MEDIUM -10, LOW -3,
floor 0). Overall = weighted mean.

| Dim | Weight | Covers |
|---|---|---|
| EH1 Swallowed / silent errors | 25 | empty/log-only catch that continues, discarded Supabase `{error}` |
| EH2 React error boundaries | 20 | `error.tsx` per segment, `global-error.tsx`, capture to tracker |
| EH3 Async / promise safety | 20 | floating promises, `Promise.all` vs `allSettled` |
| EH4 Error typing & propagation | 15 | narrow `unknown` catch, throw `Error` not string |
| EH5 Resilience | 10 | retry/timeout/circuit-breaker on transient calls, graceful degradation |
| EH6 User-facing error UX | 10 | mutation `onError`, no raw `error.message` to users |

Grade: A ≥90, B ≥80, C ≥70, D ≥60, F <60.

## Report template (keep stable - the audit pipeline parses this)

```
# Error Handling Audit - <project> - <grade> (<overall>/100)

Mode: report | fix    Stack: <Sentry?, Supabase?, TanStack Query?>

| Dimension | Score | Findings |
|---|---|---|
| EH1 Swallowed / silent errors  | NN | n |
| EH2 React error boundaries     | NN | n |
| EH3 Async / promise safety     | NN | n |
| EH4 Error typing & propagation | NN | n |
| EH5 Resilience                 | NN | n |
| EH6 User-facing error UX       | NN | n |

## Findings
### [SEVERITY] <id> <title>   (check EH1a)
- Where: <file:line>
- Evidence: <grep hit>
- Fix: <one line>  •  Auto-fixable: yes/no/guarded
- Applied: yes/no/deferred   (only in --fix mode)
```

## Rules

- **Read before flagging.** A catch that genuinely recovers (returns a fallback, retries) is NOT a
  finding — only swallow-and-continue is. Confirm by reading the site.
- The cardinal sin is `try → warn → continue`: it hides bugs. Prefer `try → record → throw/recover`.
- Report-only is the default; the only auto-fix is wrapping a thrown string in `new Error()`.
- Don't over-flag resilience — internal, fast, deterministic calls don't need retries/circuit breakers.
- Match project conventions on conflict (`.claude/rules`).
- Keep the report under ~600 lines; no raw command dumps unless flagging a finding.

## See also
- `references/checks.md` - probe + fix catalogue
- Replaces the general `error-handling-patterns` skill (its principles are folded into these checks).
- Siblings: `audit-api` (HTTP error shape), `audit-observability` (error tracker), `audit-typescript`
  (catch typing)
