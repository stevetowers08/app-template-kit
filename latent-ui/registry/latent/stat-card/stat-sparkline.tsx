"use client"

import { Line, LineChart, YAxis } from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

/**
 * A stat card's sparkline. Null points are GAPS (Wiki/Frontend/Patterns/Charts & Time
 * Series): the line breaks, nothing is interpolated or zero-filled, and a point with a
 * gap on both sides is drawn as a lone dot so it does not silently vanish.
 * Fewer than two measured points draws nothing, but keeps the height so cards align.
 */

export type SparklineTone = "neutral" | "good" | "bad" | "primary"

const STROKE: Record<SparklineTone, string> = {
  neutral: "var(--color-muted-foreground)",
  good: "var(--color-success)",
  bad: "var(--color-destructive)",
  primary: "var(--color-primary)",
}

type Point = { readonly index: number; readonly value: number | null }

function isIsolated(series: readonly (number | null)[], index: number): boolean {
  if (series[index] === null) return false
  const before = index === 0 || series[index - 1] === null
  const after = index === series.length - 1 || series[index + 1] === null
  return before && after
}

export function StatSparkline({
  series,
  tone = "neutral",
  className,
}: {
  series: readonly (number | null)[]
  tone?: SparklineTone
  /** Height lives here, e.g. "h-10". */
  className?: string
}) {
  const measured = series.filter((point) => point !== null).length
  const missing = series.length - measured
  if (measured < 2) {
    return <div aria-hidden="true" className={cn("h-10 w-full", className)} />
  }

  const data: Point[] = series.map((value, index) => ({ index, value }))
  const config = { value: { label: "Value", color: STROKE[tone] } } satisfies ChartConfig

  return (
    <div className={cn("relative h-10 w-full", className)}>
      <ChartContainer config={config} aria-hidden="true" className="aspect-auto size-full">
        <LineChart data={data} margin={{ top: 4, right: 3, bottom: 4, left: 3 }} accessibilityLayer={false}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Line
            dataKey="value"
            type="monotone"
            stroke="var(--color-value)"
            strokeWidth={2}
            connectNulls={false}
            isAnimationActive={false}
            dot={({ cx, cy, index }) =>
              isIsolated(series, index) ? (
                <circle key={index} cx={cx} cy={cy} r={2} fill="var(--color-value)" />
              ) : null
            }
            activeDot={false}
          />
        </LineChart>
      </ChartContainer>
      {missing > 0 ? (
        <span className="sr-only">
          Trend has {missing} of {series.length} periods not measured.
        </span>
      ) : null}
    </div>
  )
}
