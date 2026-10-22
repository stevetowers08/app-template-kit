import type * as React from "react"

import { Badge } from "@/components/reui/badge"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { DisplayValue, formatValue } from "@/registry/latent/lib/values"

import { DELTA_BADGE_VARIANT, DeltaIcon, resolveDelta, type StatMeasure } from "./stat-delta"

/**
 * Ported from the tours analytics app's StatCard (stat-card): muted label,
 * large tabular value, change pill, small sub line, optional progress ring to a target.
 * The change pill is computed from value and previous, so it cannot disagree with them.
 */

type Tone = "default" | "success" | "warning" | "destructive"

const VALUE_TONE: Record<Tone, string> = {
  default: "text-foreground",
  success: "text-success-foreground dark:text-success",
  warning: "text-warning-foreground dark:text-warning",
  destructive: "text-destructive-foreground dark:text-destructive",
}

export type StatCardChangePillProps = StatMeasure & {
  icon?: React.ComponentType<{ className?: string }>
  /** Small line under the value. Defaults to the footnote. */
  sub?: React.ReactNode
  /** Draws a ring for value / target. Hidden when the value is not measured. */
  target?: number | null
  /** Status colour on the value itself, for a figure that is the alarm ("12 at risk"). */
  tone?: Tone
  className?: string
}

export function StatCardChangePill({
  icon: Icon,
  sub,
  target,
  tone = "default",
  className,
  ...measure
}: StatCardChangePillProps) {
  const delta = resolveDelta(measure)
  const subLine = sub ?? measure.footnote
  const ratio =
    measure.value !== null && target !== undefined && target !== null && target > 0
      ? measure.value / target
      : null

  return (
    <Card data-slot="stat-card" className={cn("py-3", className)}>
      <CardContent className="flex h-full items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground/60" /> : null}
            <CardDescription className="truncate font-medium">{measure.label}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className={cn("text-2xl font-semibold tabular-nums", VALUE_TONE[tone])}>
              <DisplayValue value={measure.value} unit={measure.unit} currency={measure.currency} />
            </CardTitle>
            {delta ? (
              <Badge variant={DELTA_BADGE_VARIANT[delta.tone]} radius="full" size="lg" className="tabular-nums">
                <DeltaIcon direction={delta.delta.direction} />
                <span aria-hidden="true">{delta.text}</span>
                <span className="sr-only">{delta.description}</span>
              </Badge>
            ) : null}
          </div>
          {subLine ? <p className="truncate text-xs text-muted-foreground">{subLine}</p> : null}
        </div>
        {ratio !== null && target ? (
          <ProgressRing ratio={ratio} targetText={formatValue(target, measure.unit, { currency: measure.currency })} />
        ) : null}
      </CardContent>
    </Card>
  )
}

const RING_SIZE = 52
const RING_STROKE = 4

function ProgressRing({ ratio, targetText }: { ratio: number; targetText: string | null }) {
  const radius = (RING_SIZE - RING_STROKE) / 2
  const circumference = 2 * Math.PI * radius
  // Floor, not round: 99.6% must not draw a closed ring that says the target was hit.
  const percent = Math.floor(Math.min(1, Math.max(0, ratio)) * 100)
  const offset = circumference - (percent / 100) * circumference
  const centre = RING_SIZE / 2

  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      role="meter"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${percent}% of target${targetText ? ` ${targetText}` : ""}`}
      className="shrink-0 -rotate-90"
    >
      <circle cx={centre} cy={centre} r={radius} fill="none" stroke="currentColor" strokeWidth={RING_STROKE} className="text-border" />
      <circle
        cx={centre}
        cy={centre}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-primary transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  )
}
