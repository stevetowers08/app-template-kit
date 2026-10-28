---
name: audit-architecture
description: Audit a React project's code/folder structure against the project's declared layout (AGENTS.md) and what /setup-new-repo scaffolds - stack-adaptive across Next.js App Router and React+Vite SPAs. Checks route/page purity (Next app/ routes-only & thin route files / Vite src/pages thin route components), components organisation (ui/features/layout tiers, not a flat dump), lib/ dependency direction (one-way routes->components->lib, no React in lib), client/server placement (Next directive hygiene + barrel-file overuse; SPA barrel files only), and routing conventions (path aliases, single router - Next route groups / Vite react-router). Reports a scored summary; --fix moves files only with confirmation. Use whenever the user wants to audit/check/review the project structure, folder layout, file organisation, or architecture - even if they don't say "audit".
disable-model-invocation: true
argument-hint: "[--fix]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
last_verified: 2026-10-21
---

# audit-architecture

Scan a React project's **code/folder structure** against the project's own declared layout -
**stack-adaptive** across **Next.js (App Router)** and a **React + Vite SPA**. The structural
counterpart to `audit-documentation` (docs/agent files) - together they cover the whole architecture
`/setup-new-repo` establishes. Report a **scored** summary. `--fix` relocates
files only with explicit confirmation (and fixes inbound imports in the same change).

> When to use: "audit our architecture / folder structure", "is the project organised right", "check
> file layout / where things live". Mirrors the `audit-database` report shape for `/full-audit`. Keep
> the template stable. The inverse of `/setup-new-repo` for code structure; defers docs/CLAUDE.md to
> `audit-documentation`, `components/ui` reuse + tokens to `audit-design-system`, and `'use client'`
> *performance* to `audit-performance`.

## Modes

| Invocation | Behaviour |
|---|---|
| `/audit-architecture` (default) | **Report only.** Run the checks, score, output. Change nothing. |
| `/audit-architecture --fix` | Report, then relocate files - **only with confirmation per move**, fixing inbound imports in the same change (never a silent bulk move). |

## Procedure

1. **Load the declared target** (the alignment step). Read `AGENTS.md` "Project layout"/"Structure" -
   that is the target and **wins** over generic ideals. Fall back to the `/setup-new-repo` standard,
   then Next.js 2026 best practice for undeclared gaps. If there's no declared layout, recommend
   `/setup-new-repo` and audit against the standard.
2. **Detect the stack FIRST** — Next App Router (`next.config.*` + an `app/` dir) vs Vite SPA
   (`vite.config.*`, routes wired via react-router in `src/`). Then note `src/` usage + path aliases
   (`tsconfig.json` + Vite `resolve.alias`). Gate the Next-only checks per `references/checks.md`
   (ARCH1 `app/` purity → Vite `src/pages` route-component purity; ARCH4 `'use client'`/`'use server'`
   directives → `N/A`, keep barrel-file check; ARCH5 app/pages split-brain → `N/A`).
3. **Run the checks** in `references/checks.md` (ARCH1-ARCH5) by Grep/find. Flag a file misplaced only
   if it violates the **declared** layout, not merely a generic preference.
4. **Score** each dimension; compute the overall grade.
5. **Output the report** (template below).
6. **If `--fix`:** propose each relocation, get confirmation, `git mv` + repoint imports, run
   `npm run type-check` + `build`. Report applied vs deferred.

## Scoring

Start each dimension at 100; subtract per finding (CRITICAL -40, HIGH -20, MEDIUM -10, LOW -3,
floor 0). Overall = weighted mean.

| Dim | Weight | Covers |
|---|---|---|
| ARCH1 route/page purity | 25 | routes-only & thin (Next `app/` route files / Vite `src/pages` route components), no business logic or shared components dumped in them |
| ARCH3 lib + dependency direction | 25 | one-way routes→components→lib, no React in lib, no `utils.ts` junk drawer |
| ARCH2 components organisation | 20 | ui/features/layout tiers, not a flat 30+-file dir, domain code in `features/` |
| ARCH4 client/server placement | 15 | barrel-file overuse (both stacks); Next: hooks/stores client-side, no mixed-directive files (`N/A` on SPA) |
| ARCH5 routing & conventions | 15 | `src/` consistency, `@/` alias; Next: route groups, private `_folders`, no Pages+App split-brain / Vite: single react-router tree |

Weights sum to 100. Grade: A ≥90, B ≥80, C ≥70, D ≥60, F <60.

## Report template (keep stable - the audit pipeline parses this)

```
# Architecture Audit - <project> - <grade> (<overall>/100)

Mode: report | fix    Stack: <Next App Router | Vite SPA>    Declared layout: AGENTS.md | /setup-new-repo standard | none (recommend setup)

| Dimension | Score | Findings |
|---|---|---|
| ARCH1 app/ purity                | NN | n |
| ARCH3 lib + dependency direction | NN | n |
| ARCH2 components organisation    | NN | n |
| ARCH4 client/server placement    | NN | n |
| ARCH5 routing & conventions      | NN | n |

## Findings
### [SEVERITY] <id> <title>   (check ARCH1)
- Where: <path>
- Evidence: <find/grep hit>
- Fix: <relocate to … per the declared layout>  •  Auto-fixable: guarded (with import repoint)
- Applied: yes/no/deferred   (only in --fix mode)
```

## Rules

- **The project's declared layout wins.** Audit against `AGENTS.md`/`setup-new-repo`, not a generic
  ideal - a "feature folders vs flat" preference is the project's call, not a finding.
- **Stack-adaptive.** Detect Next vs Vite first. The tier/dependency-direction checks are universal,
  but mark Next-only mechanics (`app/` route purity → audit `src/pages` instead, `'use client'`/
  `'use server'` directives, app/pages split-brain) `N/A` on a Vite SPA. Never flag a missing `app/`
  dir or absent directives on a Vite app.
- **Never silently move files.** Relocations change imports across the tree - propose, confirm, and
  repoint inbound imports in the same change; then type-check + build.
- Stay in lane: docs/CLAUDE.md → `audit-documentation`; `components/ui` reuse/tokens →
  `audit-design-system`; `'use client'` perf → `audit-performance`.
- Keep the report under ~600 lines; no raw `find` dumps unless flagging a finding.

## See also
- `references/checks.md` - probe catalogue
- `/setup-new-repo` - scaffolds the structure this audits against (the inverse)
- `audit-documentation` - the docs/agent-file structural audit (the other half)
