import { SAMPLE_STATS } from "@/lib/gallery/sample-data"
import { computeDelta, DisplayValue, formatDelta } from "@/registry/latent/lib/values"

import { CardHeaderHairlineRule } from "../card-header-hairline-rule"

export function CardHeaderHairlineRuleDemo() {
  const responseTime = SAMPLE_STATS.find((stat) => stat.id === "response-time")!
  const delta = computeDelta(responseTime.value, responseTime.previous, responseTime.unit)

  return (
    <CardHeaderHairlineRule
      title="Median reply time"
      info="Time from a client message landing to the first reply being sent, median across the period."
    >
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">
          <DisplayValue value={responseTime.value} unit={responseTime.unit} />
        </span>
        {delta ? (
          <span className="text-sm text-muted-foreground">
            {formatDelta(delta)} vs {responseTime.comparison}
          </span>
        ) : null}
      </div>
    </CardHeaderHairlineRule>
  )
}
