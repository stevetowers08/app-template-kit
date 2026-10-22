import type { VariantMeta } from "@/lib/gallery/types"

/**
 * stat-card variants. Pure data (no component imports) so scripts/build-registry.ts can
 * load it in Node. The demos map in ./demos.tsx must cover every name here; the
 * `satisfies` there makes a missing or extra demo a type error.
 *
 * Every item ships stat-delta.tsx (the shared delta rules); items with a trend line also
 * ship stat-sparkline.tsx. Both are imported relatively, so they install side by side.
 */

const DIR = "registry/latent/stat-card"
const DELTA = `${DIR}/stat-delta.tsx`
const SPARKLINE = `${DIR}/stat-sparkline.tsx`

export const statCardVariants = [
  {
    name: "stat-card-change-pill",
    title: "Change pill with target ring",
    description:
      "Optional icon and muted label; large tabular value with a rounded change pill (arrow and sign); small sub line; optional progress ring to a target on the right.",
    whenToUse:
      "The default headline card for a dashboard's top row, especially when a figure has a target. Most-used stat card across Steve's apps.",
    source: "tours analytics app stat-card",
    files: [`${DIR}/stat-card-change-pill.tsx`, DELTA],
    dependencies: ["lucide-react"],
    registryDependencies: ["card", "@reui/badge"],
  },
  {
    name: "stat-card-delta-sparkline",
    title: "Caps label, sparkline and delta",
    description:
      "Caps label; big mono tabular value; 40px neutral sparkline with gaps for missing points; delta with arrow and 'vs period', coloured only when the change is bad.",
    whenToUse:
      "Operational or observability boards where the shape of the trend matters as much as the number. Note it uses mono for the value, faithful to the ops dashboard; the vault Typography Scale puts KPI numbers in sans + tabular-nums, so drop font-mono for a new app.",
    source: "ops dashboard KpiCard (+ null handling from ops dashboard HomeCharts KpiTile)",
    files: [`${DIR}/stat-card-delta-sparkline.tsx`, DELTA, SPARKLINE],
    dependencies: ["lucide-react", "recharts"],
    registryDependencies: ["card", "chart"],
  },
  {
    name: "stat-card-minimal",
    title: "Minimal label and number",
    description: "Caps label over one large tabular number. Nothing else; a null value shows a dash and its footnote.",
    whenToUse:
      "Secondary figures, dense settings or admin pages, or a row where a change would be noise. Not for a headline KPI: a number without a comparison is context-free.",
    source: "internal app stat-card (value moved from mono to sans per vault Typography Scale)",
    files: [`${DIR}/stat-card-minimal.tsx`, DELTA],
    dependencies: ["lucide-react"],
    registryDependencies: ["card"],
  },
  {
    name: "stat-card-icon-chip",
    title: "Icon chip tile with states",
    description:
      "Small muted label over a bold figure, optional delta and footnote; tinted icon chip top-right that opens an explanation tooltip. Owns loading, unavailable and not-measured states.",
    whenToUse:
      "Product and admin dashboards where each figure needs a quick 'what is this' and the data can load slowly or fail. The chip carries the tone; the number stays neutral.",
    source: "venue CRM StatTile + venue CRM ReportKpiCard",
    files: [`${DIR}/stat-card-icon-chip.tsx`, DELTA],
    dependencies: ["lucide-react"],
    registryDependencies: ["card", "skeleton", "tooltip", "@reui/icon-tile"],
  },
  {
    name: "stat-card-gradient-badge",
    title: "Gradient card with corner badge",
    description:
      "Label, large tabular value (grows with the card), outline badge top-right with the change or a share's 'N of M', optional muted footer; faint primary-to-card gradient.",
    whenToUse:
      "Report summaries and shadcn-style dashboards. The only variant that takes a share (part and whole): pick it when a percentage must always show its denominator.",
    source: "task tracker summary-cards (shadcn dashboard-01 section cards; tours analytics app design option A)",
    files: [`${DIR}/stat-card-gradient-badge.tsx`, DELTA],
    dependencies: ["lucide-react"],
    registryDependencies: ["card", "badge"],
  },
  {
    name: "stat-card-inline-gauge",
    title: "Inline change with sparkline or gauge",
    description:
      "Caps label; bold value with the change inline on its baseline; bottom slot is a sparkline tinted good or bad, or a gauge against a target.",
    whenToUse:
      "Compact market or ops strips where each card needs one visual, and some figures have a target while others have a trend.",
    source: "portfolio app MarketStatsStrip (local Card)",
    files: [`${DIR}/stat-card-inline-gauge.tsx`, DELTA, SPARKLINE],
    dependencies: ["lucide-react", "recharts"],
    registryDependencies: ["card", "chart", "progress"],
  },
  {
    name: "stat-card-legend-toggle",
    title: "Toggle tile that is the chart legend",
    description:
      "A toggle per measure: colour dot, caps label and info button; large value with a tinted change chip. Pressed tiles are solid and plotted, the rest fade back.",
    whenToUse:
      "Above a multi-series chart where the reader picks which measures to plot, so the KPI row and the legend are one control instead of two.",
    source: "SEO app TrafficMetricCards",
    files: [`${DIR}/stat-card-legend-toggle.tsx`, DELTA],
    dependencies: ["lucide-react"],
    registryDependencies: ["toggle", "tooltip", "@reui/badge"],
  },
  {
    name: "stat-card-summary-strip",
    title: "One-bar summary strip",
    description:
      "One bordered bar: caps title, then value, label and change pairs split by vertical separators; footnotes for unmeasured items listed underneath.",
    whenToUse:
      "When the page's job is a list or table and the figures are context, not the headline: four or five numbers for the height of one line.",
    source: "tours analytics app dashboard-options (option C)",
    files: [`${DIR}/stat-card-summary-strip.tsx`, DELTA],
    dependencies: ["lucide-react"],
    registryDependencies: ["card", "separator"],
  },
  {
    name: "stat-card-dice",
    title: "Dice UI stat with description",
    description:
      "Label with a bordered icon indicator beside it, value, trend line (arrow, sign, 'vs period'), a separator, then a muted description.",
    whenToUse:
      "When the card needs a written note under every figure (the period, or what it counts) and you want the Dice UI Stat slots rather than a hand-built layout.",
    source: "Dice UI stat (components/ui/stat.tsx), trend recoloured with tokens",
    files: [`${DIR}/stat-card-dice.tsx`, DELTA],
    dependencies: ["lucide-react"],
    registryDependencies: ["@diceui/stat"],
  },
  {
    name: "stat-card-trend-menu",
    title: "Trend badge with overflow menu",
    description:
      "Muted label with an overflow menu; value with a tinted change badge; hairline; the previous period's figure written out ('Vs Aug 2026: $43,100').",
    whenToUse:
      "Customisable dashboards where each card can be pinned, alerted on or removed, and readers want the previous figure, not just the percentage.",
    source: "ReUI c-card-15",
    files: [`${DIR}/stat-card-trend-menu.tsx`, DELTA],
    dependencies: ["lucide-react"],
    registryDependencies: ["card", "button", "dropdown-menu", "separator", "@reui/badge"],
  },
] as const satisfies readonly VariantMeta[]

export type StatCardVariantName = (typeof statCardVariants)[number]["name"]
