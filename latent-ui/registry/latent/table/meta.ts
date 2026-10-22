import type { VariantMeta } from "@/lib/gallery/types"

/**
 * table variants. Pure data (no component imports) so scripts/build-registry.ts can
 * load it in Node. The demos map in ./demos.tsx must cover every name here; the
 * `satisfies` there makes a missing or extra demo a type error.
 */

const DIR = "registry/latent/table"

/** Shared by every own-markup variant: the @latent column contract and its engine. */
const CORE_FILES = [
  `${DIR}/lib/latent-table-features.ts`,
  `${DIR}/lib/latent-table-columns.ts`,
  `${DIR}/lib/latent-table-sort-header.tsx`,
  `${DIR}/lib/latent-table-sections.tsx`,
  `${DIR}/lib/latent-table-states.tsx`,
  `${DIR}/lib/use-latent-table.ts`,
] as const

const CORE_DEPENDENCIES = ["@tanstack/react-table", "lucide-react"] as const
const CORE_REGISTRY = ["table", "button", "empty", "skeleton"] as const

export const tableVariants = [
  {
    name: "table-flush-toolbar",
    title: "Flush table with toolbar",
    description:
      "One toolbar line (search, select filters, clear, n of m count, actions) over a borderless table: 10px bold caps headers on a faint band, hairline row rules, no box, no pagination.",
    whenToUse:
      "The primary list on an index page where the page gutter is the frame and the list fits without paging (tens to low hundreds of rows).",
    source: "ops dashboard DataTable",
    files: [
      `${DIR}/table-flush-toolbar.tsx`,
      `${DIR}/table-flush-toolbar-bar.tsx`,
      ...CORE_FILES,
    ],
    dependencies: CORE_DEPENDENCIES,
    registryDependencies: [...CORE_REGISTRY, "input-group", "select"],
  },
  {
    name: "table-dense-dividers",
    title: "Dense table with dividers and totals",
    description:
      "Framed dense grid: tinted 28px header, 32px rows, half-strength vertical dividers, a totals band built from sumObserved, and a row-count bar when there is no totals band.",
    whenToUse:
      "Analyst-style comparison across many numeric columns where a totals row matters; the one variant that keeps vertical rules, so reserve it for number-heavy grids.",
    source:
      "tours analytics app data-table + table-styles + totals",
    files: [
      `${DIR}/table-dense-dividers.tsx`,
      `${DIR}/lib/latent-table-totals.ts`,
      ...CORE_FILES,
    ],
    dependencies: CORE_DEPENDENCIES,
    registryDependencies: [...CORE_REGISTRY, "card"],
  },
  {
    name: "table-framed-bulk-actions",
    title: "Framed table with sticky header and bulk actions",
    description:
      "Card frame; sticky solid header inside the table's own bounded scroll region; checkbox column; hairline horizontal rules only; row-count footer; floating pill of bulk actions while rows are selected.",
    whenToUse:
      "Records people act on in batches (pause, export, archive) where the list can outgrow the card, so the header must stay visible while rows scroll.",
    source:
      "venue CRM data-table + table",
    files: [
      `${DIR}/table-framed-bulk-actions.tsx`,
      `${DIR}/table-bulk-action-bar.tsx`,
      `${DIR}/lib/latent-table-scroll-region.tsx`,
      `${DIR}/lib/latent-table-select-column.tsx`,
      ...CORE_FILES,
    ],
    dependencies: CORE_DEPENDENCIES,
    registryDependencies: [...CORE_REGISTRY, "card", "checkbox", "separator"],
  },
  {
    name: "table-fixed-rows",
    title: "Fixed 36px rows in a shell",
    description:
      "No-padding card shell with a toolbar strip (title, count badge, actions) over a table-fixed grid: caps micro-header, fixed 36px single-line rows, truncation with a popover disclosure, numeric columns right-aligned and tabular.",
    whenToUse:
      "Comparison-heavy dashboards where vertical rhythm matters more than showing every character; the dense 24px mode suits fixed-height widgets.",
    source:
      "portfolio app table (TableShell, TableToolbar, TableSortHead, TableText)",
    files: [
      `${DIR}/table-fixed-rows.tsx`,
      `${DIR}/lib/latent-table-truncated-text.tsx`,
      ...CORE_FILES,
    ],
    dependencies: CORE_DEPENDENCIES,
    registryDependencies: [...CORE_REGISTRY, "card", "badge", "popover"],
  },
  {
    name: "table-titled-card",
    title: "Title above, table in a card",
    description:
      "An h2 title and the section's action on the page, then a tighter-radius Card holding a stock shadcn Table whose first and last columns take the card's 16px inset.",
    whenToUse:
      "Settings and detail pages that stack several small tables as sections; a dashboard widget table. Not the primary list of an index page (that would double-box it).",
    source: "task tracker table-card",
    files: [`${DIR}/table-titled-card.tsx`, ...CORE_FILES],
    dependencies: CORE_DEPENDENCIES,
    registryDependencies: [...CORE_REGISTRY, "card"],
  },
  {
    name: "table-stripe-flush",
    title: "Flush financial table",
    description:
      "No outer box, no vertical rules, a bottom border per row, quiet small-text header, money right-aligned in tabular figures, row actions revealed on hover or focus, and a result count underneath.",
    whenToUse:
      "Money and ledger views (invoices, payouts, runs with cost) where numeric precision and a calm, scannable surface matter more than dense controls.",
    source:
      "new (vault: Design System/Stripe.md, Design System/Linear.md row actions)",
    files: [`${DIR}/table-stripe-flush.tsx`, ...CORE_FILES],
    dependencies: CORE_DEPENDENCIES,
    registryDependencies: [...CORE_REGISTRY],
  },
  {
    name: "table-tree-gutter",
    title: "Tree table with expand gutter",
    description:
      "Framed one-level tree: a square leading gutter with a + toggle and a connector that brackets each expanded group, children on a tinted band, split hover, parent rows showing aggregates, and a count of top-level records.",
    whenToUse:
      "Parents whose children share the same columns and are compared side by side (clients and their runs, tours and departures). If the child has a different shape, use a side panel or detail page instead.",
    source:
      "tours analytics app expandable-table + expand-gutter.tsx",
    files: [
      `${DIR}/table-tree-gutter.tsx`,
      `${DIR}/table-tree-gutter-parts.tsx`,
      `${DIR}/lib/latent-table-totals.ts`,
      ...CORE_FILES,
    ],
    dependencies: CORE_DEPENDENCIES,
    registryDependencies: [...CORE_REGISTRY, "card"],
  },
  {
    name: "table-reui-grid",
    title: "ReUI data grid with toolbar and pagination",
    description:
      "Toolbar line (search, actions, Columns visibility menu) over a ReUI Data Grid with per-column sort and hide menus, row rules only, skeleton loading from column meta, and a rows-per-page pagination footer.",
    whenToUse:
      "Longer record lists that need paging and user-chosen columns, where the ReUI engine's pinning, resizing and virtualisation may be switched on later.",
    source:
      "internal app records-table (ReUI c-data-grid-1, c-data-grid-20)",
    files: [`${DIR}/table-reui-grid.tsx`],
    dependencies: ["@tanstack/react-table", "lucide-react"],
    // @reui/data-grid ships the table, pagination, scroll area, column header and
    // column visibility files together (checked with `shadcn view @reui/data-grid`).
    registryDependencies: ["@reui/data-grid", "button", "input-group"],
  },
  {
    name: "table-dice-faceted",
    title: "Dice UI data table with faceted filters",
    description:
      "Faceted filter buttons with live counts, a text filter, a reset chip and a View menu above; the table in a bordered frame with a sort-and-hide menu per header; page-size and page controls below; all state in the URL.",
    whenToUse:
      "Filter-heavy lists people share or bookmark (a filtered view is a link), and lists that will move to server-side paging, since the same URL state drives the server query.",
    source: "Dice UI data-table (tablecn)",
    files: [
      `${DIR}/table-dice-faceted.tsx`,
      `${DIR}/table-dice-faceted-rows.ts`,
      `${DIR}/lib/latent-table-states.tsx`,
    ],
    dependencies: ["@tanstack/react-table", "nuqs"],
    registryDependencies: [
      "https://diceui.com/r/data-table.json",
      "table",
      "empty",
      "skeleton",
    ],
  },
  {
    name: "table-editable-grid",
    title: "Editable spreadsheet grid",
    description:
      "Bordered spreadsheet-style grid with a sticky header inside its own bounded scroller: keyboard cell navigation, typed editors (text, number, select), range selection, copy and paste, context menu, search and an Add row footer; rows virtualised.",
    whenToUse:
      "Bulk data entry and cleanup where cell-level editing matters more than scan speed (the one case where full grid lines are right). Not for read-only reporting.",
    source: "task tracker data-grid (Dice UI data-grid)",
    files: [`${DIR}/table-editable-grid.tsx`],
    dependencies: ["@tanstack/react-table", "@tanstack/react-virtual"],
    registryDependencies: ["https://diceui.com/r/data-grid.json"],
  },
] as const satisfies readonly VariantMeta[]

export type TableVariantName = (typeof tableVariants)[number]["name"]
