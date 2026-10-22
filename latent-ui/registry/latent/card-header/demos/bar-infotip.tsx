import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SAMPLE_STATS } from "@/lib/gallery/sample-data"
import { computeDelta, DisplayValue, formatDelta } from "@/registry/latent/lib/values"

import { CardHeaderBarInfotip } from "../card-header-bar-infotip"

export function CardHeaderBarInfotipDemo() {
  const revenue = SAMPLE_STATS.find((stat) => stat.id === "revenue")!
  const delta = computeDelta(revenue.value, revenue.previous, revenue.unit)

  return (
    <CardHeaderBarInfotip
      title="Revenue"
      subtitle="Net revenue recognised in the selected period, excluding refunds."
      actions={
        <ToggleGroup defaultValue={["30d"]}>
          <ToggleGroupItem value="7d" aria-label="Last 7 days">
            7d
          </ToggleGroupItem>
          <ToggleGroupItem value="30d" aria-label="Last 30 days">
            30d
          </ToggleGroupItem>
        </ToggleGroup>
      }
    >
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">
          <DisplayValue value={revenue.value} unit={revenue.unit} />
        </span>
        {delta ? (
          <span className="text-sm text-muted-foreground">{formatDelta(delta)} vs {revenue.comparison}</span>
        ) : null}
      </div>
    </CardHeaderBarInfotip>
  )
}
