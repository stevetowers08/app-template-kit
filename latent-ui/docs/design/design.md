# Latent UI - design contract

This repo is a design system source, so its contract is short: the rules each variant must
follow so that any look applies to it. The looks themselves are data in
`registry/latent/looks/looks.ts`, each citing the vault style page it came from.

## Two axes

1. **Look** (global): colour tokens, font, `--radius`, `--surface-shadow`. Per client.
2. **Variant** (per surface): layout, density and anatomy of a card header, stat card,
   table or list. Density lives here, never in a global spacing change
   (vault `Wiki/Frontend/Foundations/Spacing & Density System`).

The shadcn style is fixed at `base-nova` (Base UI primitives).

## Layout & scroll ownership

- The single vertical scroll owner is `AppShell`'s `<main data-scroll-owner>`
  (`registry/latent/layout/app-shell.tsx`). Pages never add `overflow-y-auto`.
- Deliberate second owners are documented where they live (e.g. a table's own
  sticky-header region).
- Every page: `Page` (width + gutter) > `PageHeader` > content in `Stack`.

## Tokens

- Surfaces: `background` = page canvas only, `card` = every elevated surface, `popover` =
  overlays, `muted` = recessed (vault `Surface Tokens - background vs card`).
- Status: ReUI's `success`, `warning`, `info`, `destructive` (+ `-foreground`) tokens.
  Status and deltas are never colour alone: pair with an icon, sign or text.
- Resting card elevation: `shadow-surface` (a look sets it; most looks use none).
- Numbers: `tabular-nums`; numeric table columns right-aligned.

## Values

Unknown is `null` and renders `<Unmeasured />` ("No data" to screen readers). A real 0
renders 0. No `?? 0` on a measure. See `registry/latent/lib/values.tsx`.
