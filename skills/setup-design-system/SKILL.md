---
name: setup-design-system
description: Generate (extract + scaffold) the docs/design/ source of truth from the real codebase - design.md (tokens, type, spacing, radius, icon size scale + treatments, card types + the one card shell, scroll ownership, rules), components.md (component inventory), personas.md + voice.md (product context), tokens.css (CSS bridge). Reads what is ACTUALLY there, including the icon sizes and card shells in use (via the audit skill's scan scripts); no placeholders. This is the GENERATOR half - to score compliance and fix violations, run /audit-design-system. Use when setting up or regenerating the design-system docs, after a token/component change, or when docs/design/ is missing or stale.
disable-model-invocation: true
argument-hint: ""
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
last_verified: 2026-09-28
---

# setup-design-system

Read the real codebase, extract what is actually there, and write accurate `docs/design/` docs - the
single source of truth that `audit-design-system` then checks against. **Generator only**: this skill
does NOT audit or fix component violations - that is `/audit-design-system` (run it after).

> When to use: "set up / regenerate the design system docs", "extract our tokens/components into
> docs/design", "docs/design is missing or stale", after a token or component change. Pairs with
> `/audit-design-system` (the scored compliance check + fixer).

**Casing:** if `docs/design/` already has files, MATCH the repo's existing casing (this project uses
UPPERCASE `DESIGN.md`/`COMPONENTS.md`) - never create a lowercase duplicate. Only use the lowercase
Design-System-Floor names when the folder is empty.

## Target hierarchy

```
docs/design/
  design.md       # tokens, themes, spacing, radius, motion, rules
  components.md   # component inventory + ownership
  personas.md     # target users (from product truth, if available; else null)
  voice.md        # voice/tone/copy rules (from product truth, if available; else null)
  tokens.css      # copy of the active CSS token bridge, if present
```

## Procedure

1. **Locate source files.**
   ```bash
   echo "=== Token source (priority: packages/design-tokens > globals.css > tailwind config) ==="
   find packages/design-tokens/src/tokens/ -name "*.ts" 2>/dev/null | head
   find . -name globals.css -o -name index.css 2>/dev/null | grep -vE 'node_modules|dist|\.next'
   ls tailwind.config.* 2>/dev/null || echo "no tailwind config (v4 CSS-first)"
   echo "=== shared UI dir + app components ==="
   ls packages/ui/src/components/ 2>/dev/null || ls src/components/ui components/ui 2>/dev/null
   find src/components components -name "*.tsx" 2>/dev/null | grep -v '/ui/' | grep -v node_modules | head -30
   echo "=== fonts ==="; grep -rn "next/font\|fontFamily" app/layout.tsx src/App.tsx 2>/dev/null | head
   echo "=== scroll owners + page frame primitives ==="
   grep -rc "overflow-y-auto\|overflow-auto" app src --include=*.tsx 2>/dev/null \
     | grep -v ':0$' | grep -vE '/components/ui/|/packages/ui/' | wc -l
   grep -rlE "\b(AppShell|PageHeader|PageBody|PageLayout)\b" app src --include=*.tsx 2>/dev/null | head
   grep -rn "pageContainer\|max-w-screen-\|mx-auto w-full max-w" app src --include=*.tsx 2>/dev/null | wc -l
   ```
   Identify: `TOKEN_SOURCE` (priority: `packages/design-tokens/src/tokens/semantic/*.ts` → `globals.css`
   `@theme` → tailwind config), the shared UI dir (`packages/ui/` or `src/components/ui`), `SCAN_DIRS`,
   and the font/icon set.

2. **Extract tokens → write `design.md`.** Read `TOKEN_SOURCE` in full. Check the 3-layer hierarchy
   (brand → semantic → component, per `Tailwind v4 - CSS-First Config.md`) and flag presentational
   token names. Fill the `design.md` template in `references/templates.md` - every semantic token, no
   omissions, no placeholders.

   Also record **which named style the app is on** - `Linear`, `Vercel - Geist`, `Stripe`, `Notion`,
   or none. Read the tokens against `Frontend/Design System/index.md` and name the match; if nothing
   matches, write `none (custom)` rather than forcing one. This is what `/setup-theme` applied, and a
   `design.md` that omits it loses the single fact that explains every other value in the file.

   Carry forward any **source caveat** the style page states - several are extracted from marketing
   sites rather than the logged-in product, and the Linear/Stripe type values are reconstructions, not
   vendor specs. Do not present a reconstructed number as official.

   Then fill **Layout & scroll ownership** from the step-1 scroll probe. `design.md` documenting
   header height and gutters but never saying which element owns scroll is the measured gap - it is
   what lets every page improvise its own frame. Name the ONE scroll owner; if the probe returns
   scroll containers in the dozens and no `AppShell`/`Page` primitive exists, write
   `none - N candidates` and flag it rather than picking a winner. Read
   `Frontend/Layout & IA/Page Layout Primitives & App Shell Architecture` for the rule and the
   minimum primitive set.

   Then fill **Icons** and **Cards & surfaces** from what is in use - extraction, not audit:
   ```bash
   node ~/.claude/skills/audit-design-system/scripts/icon-scan.mjs --root .   # sizes written, Button forcing, global default
   node ~/.claude/skills/audit-design-system/scripts/card-scan.mjs --root .   # Card shell, card-like primitives, framed boxes
   ```
   Record the library + facade, the global default, what the Button forces, the sizes in use and
   the card primitives with their shell. Then write the scale and card set the project should hold
   to (from the two vault notes above). If what is in use is wider than that - more than ~3 icon
   sizes in content, hand-built card shells - say so in one line (`N icon sizes in use - run
   /audit-design-system`) rather than writing the target as if it were already true.

3. **Inventory components → write `components.md`.** Read every file in the shared UI dir + app
   component dir; for each extract purpose, variants (from cva), accessibility props, correct/incorrect
   use. Fill the `components.md` template.

4. **Product context → write `personas.md`, `voice.md`, `tokens.css`.** Look for product-truth docs
   (see `references/templates.md` for the source order). Extract facts only; use `null` for anything
   absent - never invent personas or voice rules. Copy the CSS token bridge into `tokens.css` if one exists.

5. **Delegate the audit.** This skill does NOT score or fix violations. Tell the user:
   "Docs generated. Run **`/audit-design-system`** to score compliance (tokens, icon scale, primitive
   reuse, card drift, surface-token misuse, a11y/contrast) and apply the safe fixes."

6. **Type-check** if any code was touched (this skill normally only writes docs): `npx tsc --noEmit | head`.

7. **Summary.** List each doc written + its source, the token-tier verdict, and the next step
   (`/audit-design-system`).

## Rules

- **Extract, don't invent.** Read the real codebase; `null` for absent product facts; no placeholders.
- **Generator only.** Never score violations or apply fixes here - that is `/audit-design-system`.
  Running its scan scripts to learn what is in use is extraction and belongs here; grading the
  result does not. Keeping the two separate avoids double-maintenance of the same rules.
- **Respect existing casing** in `docs/design/` (don't duplicate `DESIGN.md` as `design.md`).
- Templates live in `references/templates.md` (load when writing each doc).
- Exclusions when scanning: `node_modules`, `dist`, `.next`, `*.stories/*.test/*.spec`, the token files
  themselves, and the UI library source.

## See also
- `references/templates.md` - the exact doc templates
- `/audit-design-system` - the scored compliance check + fixer (the audit half this skill delegates to)
- Global "Design System Floor" rule (CLAUDE.md) - every project needs `docs/design/design.md` + `components.md`
