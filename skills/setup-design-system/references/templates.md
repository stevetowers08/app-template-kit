# design-system — doc templates

The exact markdown to write into `docs/design/`. Fill from the real codebase; never leave
placeholders. Use `null` for genuinely-absent product facts (personas/voice), never invent them.

**Casing:** if `docs/design/` already has files, MATCH the repo's existing casing (e.g. this project
uses UPPERCASE `DESIGN.md`/`COMPONENTS.md`) — do NOT create a lowercase duplicate. Only fall back to
the lowercase Design-System-Floor names when the folder is empty.

---

## design.md

```markdown
---
stack: [Tailwind v3/v4] + [shadcn/ui | NativeWind + RNR]
style: [Linear | Vercel - Geist | Stripe | Notion | none (custom)]
shadcn-preset: [<base>-<style>, e.g. base-nova | n/a]
token-source: [TOKEN_SOURCE path]
token-tiers: [brand + semantic + component | semantic only | single-tier]
generated: [YYYY-MM-DD]
---

# [Project Name] Design System

## Style
[The named style from Wiki/Frontend/Design System/, and the one-line "when to use" that made it
the right fit. Then any source caveat that page states - e.g. tokens extracted from a marketing
site rather than the product, or type values reconstructed rather than vendor-published. Write
`none (custom)` if no style page matched; do not force a match.]

The shadcn preset (`shadcn-preset` above) sets component-level density. Density is NOT changed
here - `--spacing` is a Tailwind v4 multiplier and shrinking it silently resizes every existing
utility in the app.

## Token hierarchy
[Describe what tiers exist. If single-tier (raw values used directly), note it as tech debt.]

## Color tokens
| Token | Tailwind class | CSS variable | Light | Dark | WCAG role |
|-------|---------------|--------------|-------|------|-----------|
[Every semantic token — no omissions. WCAG role = "text on bg-background", "icon on muted", etc.]

## Typography
| Element | Classes | Min contrast vs bg | Notes |
|---------|---------|-------------------|-------|
| h1 | `text-3xl font-bold tracking-tight` | 4.5:1 | |
| h2 | `text-2xl font-semibold` | 4.5:1 | |
| body | `text-sm` | 4.5:1 | default |
| caption | `text-xs text-muted-foreground` | 4.5:1 | verify muted contrast |
[Match the actual font scale. Flag any token pair that may fail 4.5:1.]
**Fonts**: [from font config]   **Icons**: see Icons below

## Spacing
| Tailwind | px | Common use |
[gap-2 8px tight · gap-4 16px default · gap-6 24px sections · p-4/p-6 card/section padding — match actual usage]

## Radius
| Token | Value | Use |
| `--radius` [value] base · rounded-sm chips · rounded-md buttons/inputs · rounded-lg cards · rounded-xl modals |

## Icons
**Set**: [lucide-react | @phosphor-icons/react | custom set] via [facade path, or `direct imports`]
**Global default**: [e.g. Phosphor `IconContext` size 16 in `<file>` | none - lucide renders 24 unsized]
**Button**: [forces svg children to 16px unconditionally | 16px unless the icon has a size-* class | does not size them]
**In use today**: [written sizes and site counts from icon-scan.mjs, e.g. "12: 98 · 14: 206 · 16: 226 · 20: 13"]

| px | Class | Use |
|----|-------|-----|
| 16 | `h-4 w-4` | Every icon beside text: headings, field rows, list rows, chevrons, checks, links, meta, buttons |
| 12 | `h-3 w-3` | Only a glyph inside a small container: pill, badge, chip, timeline dot |
| [28] | via `EmptyState` | Empty and error states only |
| [22] | in the primitives | App header / nav rail only, if the chrome runs larger |

Treatments: plain glyph (default), tile (a 16px glyph in a tinted square - more presence), avatar
(a person or record); never mixed within one role. Never size an icon inside a Button - its
`[&_svg]` rule outranks the icon's own class. [If "in use" is wider than the table: one line,
`N sizes in use - run /audit-design-system`.] Cross-project why: vault
`Frontend/Components & Styling` -> "Icon sizes and treatments".

## Cards & surfaces
**Card shell** (the primitive owns it): [radius] · [border token] · `bg-card` · [shadow: none at rest] · padding [16px, 12px compact]
**In use today**: [from card-scan.mjs: Card uses, call-site shell overrides, hand-built framed boxes]

| Type | Component | Use |
|------|-----------|-----|
| Titled card | [Section card / Card + header] | a titled block in a widget grid |
| Stat tile | [StatTile] | one number with label and trend |
| Callout | [Notice / Alert] | alerts and banners, one tint per tone |
| Clickable / selectable | [ActionCard / ChoiceCard] | whole card is a link / an option |
| Board card | [KanbanCard] | kanban only |
| Inline empty state | [EmptyState inline] | "nothing here yet" inside a section |

Title placement: [inside the card with a divider | a section heading above] - one, app-wide.
"See more": [title link with chevron | View all link] - one. No card inside a card. Cross-project
why: vault `Frontend/Patterns/Cards & Tiles`.

## Layout & scroll ownership
| Fact | Value |
|-------|-------|
| Scroll owner | [the ONE element that owns vertical scroll — name the component + file, e.g. `AppShell` in `app/layout.tsx`. If no single owner exists write `none — N candidates` using the count below, and flag it as a finding] |
| Scroll containers in app code | [count of `overflow-y-auto` / `overflow-auto` outside the shared UI dir] |
| Page frame primitives | [which of AppShell / Page / PageHeader / PageBody exist; `none` for the rest] |
| Page width + gutter source | [the one helper or primitive that sets them, e.g. `pageContainer()` — or `per-page` if each page improvises] |
| Deliberate second scroll owners | [split views, chat panes, virtualised tables — named, or `none`] |

`position: sticky` sticks to the nearest scrolling or clipping ancestor, **not the viewport**. So
"which element scrolls" has to be stated, not inferred: a page that declares its own
`overflow-y-auto` *and* its own sticky header has silently taken over the shell's job, and the
symptom (sticky that will not stick, two scrollbars, header misaligned with content) surfaces on a
different page. Dozens of scroll containers with no named owner is the tell.

Cross-project reference: `Frontend/Layout & IA/Page Layout Primitives & App Shell Architecture` in
the vault — the one-scroll-owner rule, the four recurring bugs it explains, and the minimum
primitive set (`AppShell` with a required `scroll` prop and no default, `Page`, `PageHeader`,
`Stack`/`Inline`).

## Shared UI package / dir
[packages/ui/ → Import: @workspace/ui; rule: import from here before building app components; list components.
 Else → App-level components dir: COMPONENT_DIR.]

## Rules
### Token rules
- Never hardcode hex — use semantic colour tokens above. Never use primitive tokens directly in components.
- Never use presentational token names (color-red) — use role-based (color-error). Tokens work in both themes.
### Component rules
- Always check the shared UI dir before building. If it has it, import — never duplicate.
- Never use raw HTML form elements (`<button>/<input>/<select>/<textarea>`) — use the shadcn equivalents.
- Flag, don't invent — if a needed component is missing everywhere, say so.
### Styling rules
- Never `style={{ }}` with hardcoded values; never arbitrary Tailwind (`bg-[#fff]`, `p-[13px]`).
- A page never declares page-level scroll. Scroll ownership belongs to the shell named in
  **Layout & scroll ownership** above; a page that owns `overflow-y-auto` *and* pins a sticky header
  is a hand-rolled page frame. Width and gutter come from the page primitive, not per-page classes.
- Surface tokens are semantic: `bg-background` is the **page canvas only**. Cards/panels/bordered boxes →
  `bg-card`; overlays (dropdown/tooltip/popover) → `bg-popover`; recessed strips → `bg-muted`. A
  `rounded border bg-background` box (or a bordered wrapper with no bg) is the bug — the page colour bleeds
  through and it breaks worse in dark mode.
### Accessibility rules (WCAG 2.2 AA)
- Text 4.5:1 / large text (≥18.66px or 14px bold) 3:1 / non-text UI + borders 3:1 vs background token.
- Visible focus ring on every keyboard-focusable element. All images `alt` (empty for decorative).
- All inputs labelled. Icon-only buttons need `aria-label`. Colour is never the only signal. Respect
  `prefers-reduced-motion`.

## Component inventory
See [components.md](./components.md)
```

## components.md

```markdown
# Component Inventory

> Check the shared UI dir first. If it has what you need, import from there.
> Then check app-level components. If nothing matches — flag it, don't build a duplicate.
> Generated: [date] — regenerate with /setup-design-system

## Shared UI package components
[List with import path, e.g. `import { Button } from '@workspace/ui'`. Each: name + one-line purpose.]

## App-level components (<COMPONENT_DIR>)
### [ComponentName]
**File**: `<path>`   **Purpose**: [one line]   **Variants**: [from cva]
**Key props**: [non-obvious; skip className/children/ref]   **Accessibility**: [aria + keyboard]
**Use for**: [correct cases]   **Do NOT use for**: [misuse]
[Repeat for every component, grouped: Layout / Forms / Data Display / Feedback / Navigation / Charts / Custom]
```

## personas.md  (product context — extract only, never invent)

```markdown
# Personas
> Extracted from [source path]. If this conflicts with the product master, the master wins.
## Target Users
[Primary / secondary / power user / not-the-user. `null` if absent.]
## Personas
[Named personas: motivations, activation moments, churn risks. `null` if absent.]
```

## voice.md  (product context — extract only)

```markdown
# Voice
> Extracted from [source path]. If this conflicts with the product master, the master wins.
## Product Name   [name + casing rules | null]
## Personality    [brand territory + personality | null]
## Output Tone    [voice/tone bullets | null]
## Preferred Labels   [approved labels | null]
## Banned Terms   [banned terms/claims | null]
## Messaging      [pain, outcome, objection-handling, sales-copy rules | null]
```

## tokens.css
- If the project has an active CSS token bridge (`app/globals.css`, `src/index.css`, mobile `global.css`),
  copy it exactly into `docs/design/tokens.css`.
- If tokens are TypeScript-only with no CSS bridge, write `docs/design/tokens.css` containing `null` + a note
  naming the canonical token source. It's a reference bridge, not canonical unless the project uses CSS as truth.

---

## Product-truth sources (Phase: product context)
Look in order; extract facts only, `null` for unknown:
1. `docs/QLIP_MASTER.md` · 2. `docs/product.md`/`brand.md`/`marketing.md` · 3. PRDs under `docs/prds/` ·
4. `AGENTS.md`/`CLAUDE.md` brand or product sections.

## Token hierarchy reference (Phase: extract)
2026 standard = 3 tiers. Flag presentational token names → semantic:
`--color-red`→`--color-error/destructive` · `--color-blue`→`--color-primary/info` ·
`--color-gray-500`→`--color-muted-foreground` · `--font-size-16`→`--font-size-body` · `--space-16`→`--spacing-md`.
If only one tier (raw values used directly), note it as a structural finding.
