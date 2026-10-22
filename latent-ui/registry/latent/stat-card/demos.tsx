import type { Demo } from "@/lib/gallery/types"

import { ChangePillDemo, DeltaSparklineDemo } from "./demos/card-demos"
import { IconChipDemo, MinimalDemo } from "./demos/tile-demos"
import { LegendToggleDemo } from "./demos/legend-demo"
import { DiceDemo, TrendMenuDemo } from "./demos/primitive-demos"
import { GradientBadgeDemo, InlineGaugeDemo, SummaryStripDemo } from "./demos/trend-demos"
import type { StatCardVariantName } from "./meta"

/** One demo per variant, rendered with sample data in the gallery. */
export const statCardDemos = {
  "stat-card-change-pill": ChangePillDemo,
  "stat-card-delta-sparkline": DeltaSparklineDemo,
  "stat-card-minimal": MinimalDemo,
  "stat-card-icon-chip": IconChipDemo,
  "stat-card-gradient-badge": GradientBadgeDemo,
  "stat-card-inline-gauge": InlineGaugeDemo,
  "stat-card-legend-toggle": LegendToggleDemo,
  "stat-card-summary-strip": SummaryStripDemo,
  "stat-card-dice": DiceDemo,
  "stat-card-trend-menu": TrendMenuDemo,
} satisfies Record<StatCardVariantName, Demo>
