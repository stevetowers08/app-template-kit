import type { VariantMeta } from "@/lib/gallery/types"

/**
 * list variants. Pure data (no component imports) so scripts/build-registry.ts can
 * load it in Node. The demos map in ./demos.tsx must cover every name here; the
 * `satisfies` there makes a missing or extra demo a type error.
 */
export const listVariants = [
  {
    name: "list-item-outline",
    title: "Item, outlined",
    description: "Outlined two-line row: avatar, title with a status badge, meta line, hover-revealed actions.",
    whenToUse: "A default record list (clients, contacts, connections) where every row needs its own visual boundary.",
    source: "ops dashboard ListRow",
    files: ["registry/latent/list/list-item-outline.tsx"],
    registryDependencies: ["avatar", "badge", "item"],
  },
  {
    name: "list-hover-rows",
    title: "Hover rows in a card",
    description: "One Card, borderless rows, hover tint only, tabular figures stacked right.",
    whenToUse: "A dashboard-tile list (top clients, recent changes) where the Card is the only box and rows stay flush.",
    source: "tours analytics app CapacityChangesList",
    files: ["registry/latent/list/list-hover-rows.tsx"],
    registryDependencies: ["card", "item"],
  },
  {
    name: "list-record-rows",
    title: "Record rows",
    description: "Flat row: icon tile, title, subtitle, an optional badge and a trailing chevron.",
    whenToUse: "A navigable index (deals, events, connections) where every row goes to a detail page.",
    source: "venue CRM RecordList",
    files: ["registry/latent/list/list-record-rows.tsx"],
    dependencies: ["lucide-react"],
    registryDependencies: ["badge", "item", "@reui/icon-tile"],
  },
  {
    name: "list-glyph-card",
    title: "Glyph card",
    description: "A full card per row: tinted glyph tile, title plus badge, a two-line description, trailing actions.",
    whenToUse: "A mixed-content list (ideas, templates, tasks) where each item reads as its own tile, not a table line.",
    source: "SEO app content-card",
    files: ["registry/latent/list/list-glyph-card.tsx"],
    registryDependencies: ["badge", "item", "@reui/icon-tile"],
  },
  {
    name: "list-setting-rows",
    title: "Setting rows",
    description: "One Card, hairline-divided rows, the control (switch/checkbox) BEFORE the label and description.",
    whenToUse: "A preferences or per-agent settings panel where the toggle's state is the first thing to scan.",
    source: "tours analytics app setting-row",
    files: ["registry/latent/list/list-setting-rows.tsx"],
    registryDependencies: ["card", "item"],
  },
  {
    name: "list-task-rows",
    title: "Task rows",
    description: 'Done toggle, title, and "Due <Weekday>, N days late" - "No due date" and "Unassigned" when unset.',
    whenToUse: "A task or to-do list where the due state is the second most important fact after the title.",
    source: "task tracker task-line",
    files: ["registry/latent/list/list-task-rows.tsx", "registry/latent/list/lib/list-format.ts"],
    registryDependencies: ["avatar", "checkbox", "item"],
  },
  {
    name: "list-mini-rows",
    title: "Mini rows",
    description: "Compact dot rows, no border, a monospaced due date right, hover tint only.",
    whenToUse: "A dense sidebar or widget list where many rows must fit without their own chrome.",
    source: "ops dashboard page (MiniRow)",
    files: ["registry/latent/list/list-mini-rows.tsx", "registry/latent/list/lib/list-format.ts"],
    registryDependencies: ["item"],
  },
  {
    name: "list-timeline-feed",
    title: "Timeline feed",
    description: "A dot per entry joined by a connector line; most recent marked active; an icon carries the tone.",
    whenToUse: "A chronological activity feed (audit trail, agent history) where sequence matters more than grouping.",
    source: "venue CRM ActivityFeed, via Dice UI timeline",
    files: ["registry/latent/list/list-timeline-feed.tsx", "registry/latent/list/lib/list-format.ts"],
    dependencies: ["lucide-react"],
    registryDependencies: ["@diceui/timeline"],
  },
  {
    name: "list-grouped-feed",
    title: "Grouped feed",
    description: "One Card per group (e.g. a day), a tinted header with a dot and count, divide-y rows beneath.",
    whenToUse: "A feed with a natural grouping (by day, by client) where the count-per-group is worth surfacing.",
    source: "tours analytics app news-feed",
    files: ["registry/latent/list/list-grouped-feed.tsx"],
    registryDependencies: ["badge", "card", "item"],
  },
  {
    name: "list-expandable-runs",
    title: "Expandable run rows",
    description: "A status dot, agent and task, elapsed time; click to expand into client, status, duration and cost.",
    whenToUse: "An agent run history where the row stays short but the full detail is one click away.",
    source: "portfolio app ActivityFeed",
    files: ["registry/latent/list/list-expandable-runs.tsx", "registry/latent/list/lib/list-format.ts"],
    dependencies: ["lucide-react"],
    registryDependencies: ["collapsible", "item", "status"],
  },
  {
    name: "list-approval-queue",
    title: "Approval queue",
    description: "One card per run needing a human: Approve/Reject for a draft awaiting sign-off, Retry/Dismiss for a failure.",
    whenToUse: "An AI OS home screen's human-in-the-loop queue - the first thing an operator should act on.",
    source: "ReUI agent-activity-1",
    files: ["registry/latent/list/list-approval-queue.tsx", "registry/latent/list/lib/list-format.ts"],
    dependencies: ["lucide-react"],
    registryDependencies: ["badge", "button", "card", "@reui/icon-tile"],
  },
] as const satisfies readonly VariantMeta[]

export type ListVariantName = (typeof listVariants)[number]["name"]
