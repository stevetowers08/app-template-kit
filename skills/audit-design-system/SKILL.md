---
name: audit-design-system
description: Audit a project's design-system compliance and score it. Token usage (prefer a v4-aware token linter that reads @theme; flag hardcoded hex/rgb/hsl and arbitrary values), the icon size scale (too many icon sizes, the same role at different sizes, dead size classes inside Buttons, an off-scale global default - via a JSX-tree scan script), primitive reuse + a Component Coverage Rate metric (no hand-rolled cards/badges/buttons; card types and shell drift - hand-built card copies, restyled Card primitives, inconsistent card titles and callouts; shadcn composition rules; surface-token misuse like bg-background-as-a-surface; import from the shared UI dir; scroll ownership - one named scroll owner and page-frame primitives instead of per-page flex), inline-style hygiene, accessibility + WCAG 2.2 contrast (axe-core for the live check), the docs/design floor, library/config hygiene, and an optional live pass that measures rendered icon sizes and card surfaces in the browser. Reports a scored summary; pass --fix for safe low-risk fixes; proposes guard tests (templates included) for drift that has recurred. Use whenever the user wants to audit/check/review the design system, asks why icons or cards look inconsistent, wants hardcoded colours or hand-rolled components found, or wants design drift measured - even if they don't say "audit". Pairs with /setup-design-system (the generator).
disable-model-invocation: true
argument-hint: "[--fix] [--tokens|--primitives|--a11y|--docs]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
last_verified: 2026-10-21
---

# audit-design-system

Scan a project for design-system drift against the global "Design System Floor" + "UI Components
(reuse-first)" rules and the project's own `docs/design/`: tokens only, reuse-first primitives, no
stray inline styles, accessible interactive elements, and the design-docs floor. Report a **scored**
summary. With `--fix`, apply only the low-risk fixes; anything that swaps a component, picks a token,
or generates design docs is report-only.

> When to use: "audit the design system", "check for hardcoded colours / inline styles", "are we
> reusing components", "token compliance", "design-system violations". Mirrors the `audit-database`
> report shape so it can slot into a `/full-audit`-style pipeline. Keep the report template stable.

## Modes

| Invocation | Behaviour |
|---|---|
| `/audit-design-system` (default) | **Report only.** Run every check, score, output the report. Change nothing. |
| `/audit-design-system --fix` | Report, then apply **auto-fixable** checks (add `alt=""`/focus-visible rings, `clsx`→`cn`, exact-match spacing token). Ask before anything guarded. |
| `--fix --tokens` / `--primitives` / `--a11y` / `--docs` | Limit fixes to that dimension. |

`--fix` NEVER swaps a hand-rolled element for a primitive, picks a colour token, or generates design
docs without explicit confirmation - those need human judgement.

## Procedure

1. **Detect the system.** Find the shared UI dir (`packages/ui/` or `src/components/ui/` /
   `components/ui/`) and the token source (Tailwind v4 `@theme` in `globals.css`, or
   `docs/design/tokens.css`). Note the framework (this project: Tailwind v4, no `tailwind.config.ts`).
2. **Load the contract.** Read `docs/design/design.md` + `components.md` and any
   `.claude/rules/frontend.md`. Project rules outrank generic advice on conflict (e.g. this project
   allows `@mantine/core` only inside BlockNote, reserves `--ai` teal for AI signals).
3. **Run the checks** in `references/checks.md` (DS1-DS6). **DS1 spine:** prefer a v4-aware token linter
   (`oxlint-tailwindcss` / `tailwind-palette-guard`) that reads `@theme` over grep; flag the v3-config
   gotcha if present. Compute the **Component Coverage Rate** (DS2·coverage, target ≥80%) and include
   surface-token misuse (DS2·surface). Grep is the static fallback. WCAG 2.2 **contrast's authoritative
   check is axe-core live** — defer that run to `audit-console-logs` and report `SKIPPED (no live a11y)`
   here, with the token-pair computation as the static approximation. Never guess a ratio.
   **DS1·icons and DS2·cards run scripts, not grep** - `scripts/icon-scan.mjs` and
   `scripts/card-scan.mjs` read the JSX tree with the repo's own TypeScript (any React TSX/JSX app,
   single or monorepo). Read each script's coverage line before trusting its counts.
3b. **Live pass (DS·live)** when a dev server and a test login exist: `scripts/measure-live.mjs`
   measures rendered icon sizes and card surfaces per page and tab, with screenshots. Report
   rendered sizes from it, not from classes.
4. **Score** each dimension and compute the overall grade.
5. **Output the report** (template below).
6. **If `--fix`:** apply auto-fixable findings only, re-grep to confirm cleared, then run
   `npm run lint` + `npm run type-check` (or `tsc --noEmit`) after edits. Report applied vs deferred.

## Scoring

Each dimension scores 0-100; overall is the weighted mean. Start at 100, subtract per finding by
severity (CRITICAL -40, HIGH -20, MEDIUM -10, LOW -3, floor 0).

| Dim | Weight | Covers |
|---|---|---|
| DS1 Token compliance | 25% | no hardcoded hex/rgb/hsl colours, no arbitrary spacing/radius literals that duplicate a token; **icon size scale** (DS1·icons) |
| DS2 Primitive reuse | 25% | no hand-rolled card/badge/button/input as a raw styled `<div>`; import from shared UI dir; missing primitives added there, not inlined; **card types and shell drift** (DS2·cards); **scroll ownership** - one named scroll owner and page-frame primitives rather than per-page flex (DS2·scroll) |
| DS4 Accessibility + contrast | 20% | `<img>` alt, interactive roles + keyboard on click handlers, focus-visible rings, WCAG contrast (manual) |
| DS3 Inline styles | 15% | no static inline `style`; dynamic per-entity / CSS-var styles allowed |
| DS5 Design docs floor | 10% | `docs/design/design.md` + `components.md` (+ personas/voice/tokens.css for product apps) |
| DS6 Library + config hygiene | 5% | no competing UI libs, `cn()` over `clsx`, unmodified shadcn primitives, **motion compliance** (motion/react not framer-motion, `m`+LazyMotion, reduced-motion) |

Grade: A ≥90, B ≥80, C ≥70, D ≥60, F <60.

## Report template (keep stable - the audit pipeline parses this)

```
# Design System Audit - <project> - <grade> (<overall>/100)

Mode: report | fix    UI dir: <path>    Tokens: <globals.css @theme>    DS1: linter | grep-fallback
Component Coverage Rate: NN% (target ≥80%)    Contrast: axe-core live | static approx | SKIPPED

| Dimension | Score | Findings |
|---|---|---|
| DS1 Token compliance        | NN | n |
| DS2 Primitive reuse         | NN | n |
| DS4 Accessibility + contrast| NN | n |
| DS3 Inline styles           | NN | n |
| DS5 Design docs floor       | NN | n |
| DS6 Library + config hygiene| NN | n |

## Findings
### [SEVERITY] <id> <title>   (check DS1a)
- Where: <file:line>
- Evidence: <grep hit | missing file>
- Fix: <one line + suggested token/primitive>  •  Auto-fixable: yes/no/guarded
- Applied: yes/no/deferred   (only in --fix mode)

## Manual review
- <WCAG contrast pairs, primitive swaps, token choices>

## Skipped
- <e.g. DS2 SKIPPED (no shared UI dir found)>
```

## Rules

- **Flag, don't invent.** If a primitive doesn't exist in the shared UI dir, say so - never inline a
  one-off `<div>` as the "fix". Unknown contrast = `manual review`, never a guessed ratio.
- Report-only is the default. Auto-fix only the checks marked `Yes` in `references/checks.md`
  (add `alt`/focus-visible, `clsx`→`cn`, exact-match token).
- Never auto-swap a hand-rolled element for a primitive, pick a colour token, or generate design docs
  without explicit confirmation.
- Match the project's existing conventions; on conflict, the repo's `docs/design/` +
  `.claude/rules/frontend.md` win. Honour project-specific reservations (e.g. `--ai` token,
  `@mantine/core` only in BlockNote).
- Always import from the shared UI dir before suggesting a new component.
- **Structural questions go to the scripts, not grep** ("is this icon inside a Button", "which
  shell does this card copy"): a grep's misses are invisible and it reports clean.
- **Recurring drift gets a guard.** When a finding's class has been fixed by hand before, propose
  the matching test from `references/guard-templates.md` (per-file baseline, self-test, proven to
  fail on adoption) instead of another round of manual fixes.
- Keep the report under ~600 lines; no raw command dumps unless flagging a specific finding.

## See also

- `references/checks.md` - the probe + fix catalogue (load this when running)
- `scripts/icon-scan.mjs`, `scripts/card-scan.mjs` (static, JSX tree) and `scripts/measure-live.mjs`
  (rendered, Playwright) - run with `--root <repo>`. The two scans were tested on three apps (a
  Next.js app with `src/components/ui`, a dashboard with PascalCase `components/ui`, a monorepo
  app on a shared `packages/ui`); the live script on one (a production app, e2e login)
- `references/guard-templates.md` - icon-sizes and card-shells guard tests + the adoption steps
- Vault rules these checks grade against: `Frontend/Components & Styling.md` -> "Icon sizes and
  treatments", and `Frontend/Patterns/Cards & Tiles.md`
- Sibling pattern: `~/.claude/skills/audit-database/`, `~/.claude/skills/audit-observability/`
- Generator half: **`/setup-design-system`** (extracts + writes `docs/design/`; this skill is the
  scored compliance check + fixer it delegates to)
- Live a11y/contrast: `audit-console-logs` runs `@axe-core/playwright`; `/design-review` for visual QA
