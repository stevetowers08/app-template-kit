---
name: audit-frontend-design
description: Audit the RENDERED visual design quality of a frontend and score it. Launches the app, screenshots real pages at desktop + mobile breakpoints, and critiques what static code can't see - visual hierarchy (is there one clear entry point), typography (scale discipline, measure, rhythm), spacing & alignment rhythm, composition & whitespace (balance, gestalt grouping), perceptual colour & contrast, motion & interaction feel (easing/duration/stagger against the motion guide), and the anti-slop test (does it look intentional or templated/AI-default). Reports a scored summary in the audit-* family shape. Use whenever the user wants to audit/review/critique how the frontend LOOKS or FEELS, check visual polish, find templated/generic/slop design, review a landing page or dashboard's look, or measure design quality - even if they don't say "audit". Pairs with /audit-design-system (which owns the code-compliance half - tokens, primitive reuse, inline styles).
disable-model-invocation: true
argument-hint: "[url-or-route...] [--mobile|--desktop] [--landing|--app]"
allowed-tools: Read, Grep, Glob, Bash, Write
last_verified: 2026-08-21
---

# audit-frontend-design

Score how a frontend **actually looks and feels when rendered**, not whether the code is compliant.
This is the perceptual, screenshot-driven half of a frontend review: launch the app, capture the real
pages, and critique visual hierarchy, typography, spacing rhythm, composition, colour, motion feel, and
whether the design reads as intentional or as templated/AI-default slop. Report a **scored** summary in
the same shape as the rest of the `audit-*` family.

> When to use: "does this look good", "audit the visual design", "why does this look generic / cheap /
> templated", "review the landing page look", "critique this dashboard", "is the hierarchy clear", "the
> spacing feels off", "does the motion feel right". Report-only - this skill never edits code.

## Boundary with sibling skills (do not duplicate)

| Concern | Owner |
|---|---|
| Tokens / hardcoded hex / primitive reuse / inline styles / design-docs floor (**code**) | **`/audit-design-system`** - run it for the code half; do not re-grep those here |
| Live a11y + authoritative WCAG contrast (axe-core) | **`audit-console-logs`** (`@axe-core/playwright`) - defer the machine contrast run there |
| Loading/skeleton correctness + FOEC | **`audit-loading-animations`** |
| Motion principle source-of-truth (easing/duration/property/stagger numbers) | Obsidian **`Wiki/Growth & Marketing/Landing Pages/Landing Page Visual & Motion Design Guide`** - load it for FD6 |
| Applying fixes / redesign | **`design-taste-frontend`**, **`high-end-visual-design`**, **`interface-design`** (generators; this skill only diagnoses) |

This skill owns the **rendered visual verdict**. If any sibling points here for "does it look right", run it.

## Procedure

1. **Resolve targets.** Args are URLs or routes to audit. If none given, discover them: read the router
   (`App.tsx` / `app/` routes / `pages/`) and pick the 3-6 most important surfaces (landing/home,
   primary dashboard, a list, a detail, a form). State which you chose and why.
2. **Load the contract.** Read the repo's `docs/design/design.md` + `components.md` and any
   `.claude/rules/branding.md` / `frontend.md` so the critique is graded against the project's own
   intent (brand palette, type family, density), not generic taste. Project intent outranks generic
   advice on conflict.
3. **Render the pages.** Get the app running and screenshot each target with Playwright at **desktop
   (1440w)** and **mobile (390w)**. See `references/rendering.md` for the launch + capture recipe
   (detect dev server / `npm run dev` port, `browser_navigate`, `browser_take_screenshot`). If the app
   cannot be launched, say so and fall back to a **static, lower-confidence** read of the JSX/CSS -
   never invent what a page looks like.
4. **Run the critique.** Score dimensions **FD1-FD7** using the rubric in `references/checks.md`,
   reading the actual screenshots. For FD6 (motion), load the motion guide and check easing/duration/
   property/stagger against it; static-inspect the transition CSS/motion code for what a still frame
   can't show.
5. **Score** each dimension and compute the overall grade.
6. **Output the report** (template below). Attach or reference the screenshot paths as evidence.

## Scoring

Each dimension scores 0-100; overall is the weighted mean. Start at 100, subtract per finding by
severity (CRITICAL -40, HIGH -20, MEDIUM -10, LOW -3, floor 0). A finding is only CRITICAL/HIGH if it is
**visible in a screenshot** you captured - perceptual claims need pixel evidence, never a guess.

| Dim | Weight | Covers |
|---|---|---|
| FD1 Visual hierarchy | 20% | one clear entry point per view; size/weight/colour/space establish reading order; primary action obvious; no competing focal points |
| FD2 Typography | 18% | uses the type scale (no off-scale sizes); line length ~45-75ch; line-height + heading rhythm; weight contrast; no orphaned/cramped text |
| FD3 Spacing & alignment rhythm | 16% | consistent spacing scale; aligned edges/baselines; even gutters; related items grouped by proximity; no arbitrary one-off gaps |
| FD4 Composition & whitespace | 14% | balance, deliberate whitespace (not cramped, not sparse-by-accident); gestalt grouping; section rhythm; obvious grid |
| FD5 Colour & contrast (perceptual) | 12% | restrained accent use (one accent, not gradient-soaked); brand palette honoured; figure/ground separation; contrast reads (perceptual - defer axe to `audit-console-logs`) |
| FD6 Motion & interaction feel | 12% | ease-out entrances / custom cubic-bezier (not linear); 150-500ms; animates transform+opacity only; 40-120ms stagger; `prefers-reduced-motion`; no page-load autoplay; no uniform typing jitter |
| FD7 Anti-slop / intentionality | 8% | doesn't read as templated/AI-default (centred hero + 3 generic cards + emoji bullets); distinctive, deliberate choices; consistent voice; polish in the details |

Grade: A ≥90, B ≥80, C ≥70, D ≥60, F <60.

## Report template (keep stable - the audit pipeline parses this)

```
# Frontend Design Audit - <project> - <grade> (<overall>/100)

Mode: report    Rendered: playwright | static-fallback    Breakpoints: 1440 / 390
Targets: <route> · <route> · <route>    Contract: docs/design | none

| Dimension | Score | Findings |
|---|---|---|
| FD1 Visual hierarchy          | NN | n |
| FD2 Typography                | NN | n |
| FD3 Spacing & alignment       | NN | n |
| FD4 Composition & whitespace  | NN | n |
| FD5 Colour & contrast         | NN | n |
| FD6 Motion & interaction feel | NN | n |
| FD7 Anti-slop / intentionality| NN | n |

## Findings
### [SEVERITY] <id> <title>   (check FD1a)
- Where: <route @ breakpoint>  ·  Screenshot: <path>
- Evidence: <what is visible in the shot - "hero H1 and CTA are the same weight; no focal point">
- Fix: <one concrete direction; name the generator skill if it needs a rebuild>

## What's working
- <2-4 things the design does well - keep it honest, not just a defect list>

## Deferred / manual
- Code-compliance (tokens, primitives, inline styles) -> /audit-design-system
- Live WCAG contrast (axe-core) -> audit-console-logs
- <anything needing a human eye or a running interaction>

## Skipped
- <e.g. FD6 SKIPPED (app would not launch; motion not observable)>
```

## Rules

- **Screenshot or it didn't happen.** Every perceptual finding cites a shot you captured. If you could
  not render, mark the run `static-fallback` and drop confidence - never describe a look you inferred.
- **Report only.** This skill never edits code. Fixes are directions; hand rebuilds to
  `design-taste-frontend` / `high-end-visual-design` / `interface-design`.
- **Grade against the project's own intent first.** A deliberate maximalist brand is not "too much";
  judge against `docs/design/` + `branding.md`, then generic taste.
- **Don't duplicate siblings.** No token/hex/primitive grepping (that's `/audit-design-system`); no
  axe-core contrast run (that's `audit-console-logs`); no skeleton verdict (that's
  `audit-loading-animations`). Cite them in Deferred instead.
- **Be honest, not harsh.** Include a "What's working" section every time; balance keeps the score
  credible and the fixes actionable.
- Keep the report under ~600 lines; no raw command dumps.

## See also

- `references/checks.md` - the FD1-FD7 critique catalogue (load when running)
- `references/rendering.md` - launch + Playwright screenshot recipe
- Code half: **`/audit-design-system`** · Live a11y: **`audit-console-logs`** · Loading:
  **`audit-loading-animations`**
- Generators (the fix side): `design-taste-frontend`, `high-end-visual-design`, `interface-design`
- Motion source-of-truth: Obsidian `Wiki/Growth & Marketing/Landing Pages/Landing Page Visual & Motion Design Guide`
