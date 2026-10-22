import type { VariantMeta } from "@/lib/gallery/types"

/**
 * card-header variants. Pure data (no component imports) so scripts/build-registry.ts can
 * load it in Node. The demos map in ./demos.tsx must cover every name here; the
 * `satisfies` there makes a missing or extra demo a type error.
 */
export const cardHeaderVariants = [
  {
    name: "card-header-caps-label",
    title: "Caps label",
    description:
      "Uppercase micro-label, optional right-aligned actions, body directly below - no divider. Renders a whole Card.",
    whenToUse:
      "The quietest option: a dense dashboard tile (KPI, chart, mini table) where the label is a caption, not a heading, and a bordered bar would be too heavy repeated dozens of times on one page.",
    source: "ops dashboard components/ui/ card idiom: globals:615 `.section-label` inside a padded Card (KpiCard, ChartCard, AnalyticsTable)",
    files: ["registry/latent/card-header/card-header-caps-label.tsx"],
    dependencies: [],
    registryDependencies: ["card"],
  },
  {
    name: "card-header-icon-caps-meta",
    title: "Icon, caps label & meta",
    description:
      "Icon + uppercase micro-label + muted meta on one line, actions pinned right with ml-auto, no divider. Renders a whole Card.",
    whenToUse:
      "Same density as the caps label, plus a glyph to scan a stack of cards by type, and a short contextual fact (a count, a timeframe) beside the label.",
    source: "ops dashboard SectionHeader SectionHeader({icon,label,meta,right})",
    files: ["registry/latent/card-header/card-header-icon-caps-meta.tsx"],
    dependencies: [],
    registryDependencies: ["card"],
  },
  {
    name: "card-header-bar-infotip",
    title: "Bordered bar, info-tip subtitle",
    description:
      "A ~44px bordered header bar: optional icon, title, an (i)-tooltip or inline subtitle, an optional badge, then a right cluster of actions and/or a View all link.",
    whenToUse:
      "A chart or table card that needs a one-line explanation of the metric without permanently taking up a description row, plus room for period toggles or icon actions on the right.",
    source:
      "Dedup of tours analytics app ChartCard + table-card (tooltip subtitle), SEO app VisibilityCard (inline subtitle), tours analytics app CardSectionHeader + FeedCard.tsx (badge + View all link)",
    files: ["registry/latent/card-header/card-header-bar-infotip.tsx"],
    dependencies: ["lucide-react"],
    registryDependencies: ["card", "button", "tooltip"],
  },
  {
    name: "card-header-card-action",
    title: "Title, description & CardAction",
    description:
      "Stock shadcn CardHeader grid: title + description on the left, actions in the CardAction column on the right.",
    whenToUse:
      "The default choice when nothing else is required - a plain card with a title, an optional one-line description, and 0-2 actions. Reach for a more specific variant only when the anatomy below needs more than this.",
    source:
      "shadcn base-nova card default CardHeader grid; matches tours analytics app section-card SectionCard",
    files: ["registry/latent/card-header/card-header-card-action.tsx"],
    dependencies: [],
    registryDependencies: ["card"],
  },
  {
    name: "card-header-hairline-rule",
    title: "Title, description & hairline rule",
    description:
      "Title (optionally with an (i)-tooltip) plus a description, actions top-right, then a hairline rule separating the header from the body.",
    whenToUse:
      "A chart or analytics card where the metric needs a short definition on hover and a visible separation from the header, without the weight of a full bordered bar.",
    source: "venue CRM ChartCard ChartCard({title,description?,info?,actions?})",
    files: ["registry/latent/card-header/card-header-hairline-rule.tsx"],
    dependencies: ["lucide-react"],
    registryDependencies: ["card", "button", "tooltip", "separator"],
  },
  {
    name: "card-header-outside-icon",
    title: "Section heading outside the card",
    description:
      "Heading sits OUTSIDE any card: an icon tile, the title, a muted count, optional hover-help, an optional chevron to navigate, actions right. Body (a Card, a table) follows as a sibling.",
    whenToUse:
      "Grouping several cards/tables/lists under one named section on a page, where a boxed CardTitle would put a border around content that only needs a label - or where the section itself links through to a fuller view.",
    source:
      "venue CRM Section Section({title,description?,help?,icon?,count?,onNavigate?,actions?}) - test-enforced (section-heading.test) after the app collected five heading sizes",
    files: ["registry/latent/card-header/card-header-outside-icon.tsx"],
    dependencies: ["lucide-react"],
    registryDependencies: ["button", "tooltip", "@reui/icon-tile"],
  },
  {
    name: "card-header-inline-dot",
    title: "Inline status dot",
    description:
      "A tone-coloured status dot beside the title, an optional badge inline with it, controls pinned right. No divider. Renders a whole Card.",
    whenToUse:
      "A compact list of entities (clients, agents, connections) where the header itself needs to flag a live/paused/error state at a glance, without a bordered bar.",
    source: "portfolio app BookShapeCard and similar dot + text-base font-semibold title + badge idiom (17 files, no shared component)",
    files: ["registry/latent/card-header/card-header-inline-dot.tsx"],
    dependencies: [],
    registryDependencies: ["card"],
  },
  {
    name: "card-header-dropdown-actions",
    title: "Status badge & overflow menu",
    description:
      "A static status badge on the left and an overflow DropdownMenu on the right, in a bordered top bar. Renders a whole Card (p-0).",
    whenToUse:
      "A card whose header needs exactly one status fact plus a menu of secondary actions (edit, copy link, remove) that don't deserve dedicated buttons.",
    source: "ReUI @reui/c-card-16 \"Card with header badge and actions\"",
    files: ["registry/latent/card-header/card-header-dropdown-actions.tsx"],
    dependencies: ["lucide-react"],
    registryDependencies: ["card", "button", "dropdown-menu"],
  },
] as const satisfies readonly VariantMeta[]

export type CardHeaderVariantName = (typeof cardHeaderVariants)[number]["name"]
