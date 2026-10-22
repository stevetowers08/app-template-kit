"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DisplayValue, formatValue } from "@/registry/latent/lib/values"

import { DeltaText, resolveDelta, type ResolvedDelta, type StatMeasure } from "./stat-delta"
import { StatSparkline, type SparklineTone } from "./stat-sparkline"

/**
 * Ported from Pulse's MarketStatsStrip card (src/components/dashboard/MarketStatsStrip.tsx):
 * caps label, bold value with the change inline on its baseline, and a bottom slot that is
 * either a sparkline coloured by whether the change is good, or a gauge against a target.
 *
 * Pulse read a missing figure as `?? 0` and printed $0 / 0%; here a null value shows
 * <Unmeasured />, the delta is dropped and the bottom slot stays empty at the same height.
 */

export type StatCardInlineGaugeProps = StatMeasure & {
  visual?: "sparkline" | "gauge"
  /** Oldest first. Null points are gaps. Used by the sparkline. */
  series?: readonly (number | null)[]
  /** Used by the gauge. */
  target?: number | null
  className?: string
}

const SPARK_TONE: Record<ResolvedDelta["tone"], SparklineTone> = { good: "good", bad: "bad", flat: "neutral" }

export function StatCardInlineGauge({
  visual = "sparkline",
  series = [],
  target = null,
  className,
  ...measure
}: StatCardInlineGaugeProps) {
  const delta = resolveDelta(measure)

  return (
    <Card size="sm" className={className}>
      <CardContent className="flex h-full flex-col gap-2">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{measure.label}</span>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <DisplayValue
            value={measure.value}
            unit={measure.unit}
            currency={measure.currency}
            className="text-xl leading-tight font-bold tracking-tight tabular-nums"
          />
          {delta ? <DeltaText delta={delta} /> : null}
        </div>
        {measure.value === null && measure.footnote ? (
          <p className="text-xs text-muted-foreground">{measure.footnote}</p>
        ) : null}
        <div className="mt-auto">
          {visual === "gauge" ? (
            <TargetGauge measure={measure} target={target} />
          ) : (
            <StatSparkline series={series} tone={delta ? SPARK_TONE[delta.tone] : "neutral"} className="h-9" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TargetGauge({ measure, target }: { measure: StatMeasure; target: number | null }) {
  const { value, unit, currency, label } = measure
  if (value === null || target === null || target <= 0) {
    return <div aria-hidden="true" className="h-9" />
  }
  const targetText = formatValue(target, unit, { currency })
  const percent = Math.floor((value / target) * 100)

  return (
    <Progress
      value={Math.min(Math.max(value, 0), target)}
      max={target}
      aria-label={`${label} against target`}
      getAriaValueText={() => `${percent}% of target ${targetText ?? ""}`.trim()}
      className="h-9 content-end gap-1.5"
    >
      <span aria-hidden="true" className="text-xs font-medium text-muted-foreground tabular-nums">
        {percent}% of target
      </span>
      <span aria-hidden="true" className="ml-auto text-xs font-medium text-muted-foreground tabular-nums">
        {targetText}
      </span>
    </Progress>
  )
}
