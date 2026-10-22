import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { DisplayValue } from "@/registry/latent/lib/values"

import { DeltaText, QUIET_DELTA_TEXT_CLASS, resolveDelta, type StatMeasure } from "./stat-delta"
import { StatSparkline } from "./stat-sparkline"

/**
 * Ported from the ops dashboard's KpiCard (KpiCard), with the
 * null handling of its HomeCharts KpiTile: caps label, big mono value, a neutral 40px
 * sparkline, then the delta. Only a bad change is coloured; good and flat stay quiet.
 *
 * The mono value is faithful to the ops dashboard. The vault's Typography Scale reserves mono
 * for code and IDs and puts KPI numbers in sans + tabular-nums; drop `font-mono` to follow it.
 */

export type StatCardDeltaSparklineProps = StatMeasure & {
  /** Oldest first. Null points are gaps. */
  series?: readonly (number | null)[]
  className?: string
}

export function StatCardDeltaSparkline({ series = [], className, ...measure }: StatCardDeltaSparklineProps) {
  const delta = resolveDelta(measure)

  return (
    <Card className={cn("gap-3", className)}>
      <CardContent className="flex flex-col gap-3">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{measure.label}</span>
        <DisplayValue
          value={measure.value}
          unit={measure.unit}
          currency={measure.currency}
          className="font-mono text-2xl leading-none tracking-tight tabular-nums"
        />
        <StatSparkline series={series} tone="neutral" />
        {delta ? (
          <DeltaText delta={delta} toneClass={QUIET_DELTA_TEXT_CLASS} className="font-mono" />
        ) : measure.footnote ? (
          <p className="text-xs text-muted-foreground">{measure.footnote}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
