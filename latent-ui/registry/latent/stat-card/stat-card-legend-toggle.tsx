"use client"

import { InfoIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { Toggle } from "@/components/ui/toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { DisplayValue } from "@/registry/latent/lib/values"

import { DELTA_BADGE_VARIANT, DeltaIcon, resolveDelta, type StatMeasure } from "./stat-delta"

/**
 * Ported from the SEO app's TrafficMetricCards (TrafficMetricCards):
 * each tile is a toggle that doubles as the chart legend. Colour dot and caps label, then
 * the value with a tinted change chip; a pressed tile is solid, the rest fade back.
 *
 * Changes from the source: the tile is the shadcn Toggle (aria-pressed), the help icon sits
 * beside it rather than inside it (a button inside a button is invalid), a change from a
 * previous value of 0 is no change shown rather than "0% up", and a null value disables
 * the tile, since there is no series to show.
 */

export type StatCardLegendToggleProps = StatMeasure & {
  /** The colour of this tile's series on the chart, as a CSS colour, e.g. "var(--chart-2)". */
  color: string
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  /** What the measure means. Opens from an info button beside the toggle. */
  help?: string
  className?: string
}

export function StatCardLegendToggle({
  color,
  pressed,
  onPressedChange,
  help,
  className,
  ...measure
}: StatCardLegendToggleProps) {
  const delta = resolveDelta(measure)
  const unmeasured = measure.value === null

  return (
    <div className={cn("relative min-w-0", className)}>
      <Toggle
        variant="outline"
        pressed={pressed && !unmeasured}
        onPressedChange={onPressedChange}
        disabled={unmeasured}
        className="h-auto w-full flex-col items-stretch justify-start gap-1 p-3 text-left font-normal whitespace-normal hover:bg-card hover:opacity-100 aria-pressed:bg-card not-aria-pressed:border-transparent not-aria-pressed:opacity-60 disabled:opacity-60"
      >
        <span className="flex min-w-0 items-center gap-1.5 pr-6">
          <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <span className="sr-only">Show on chart: </span>
          <span className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {measure.label}
          </span>
        </span>
        <span className="flex flex-wrap items-baseline gap-2">
          <DisplayValue
            value={measure.value}
            unit={measure.unit}
            currency={measure.currency}
            className="text-2xl font-semibold tabular-nums"
          />
          {delta ? (
            <Badge variant={DELTA_BADGE_VARIANT[delta.tone]} className="tabular-nums">
              <DeltaIcon direction={delta.delta.direction} />
              <span aria-hidden="true">{delta.text}</span>
              <span className="sr-only">{delta.description}</span>
            </Badge>
          ) : null}
        </span>
        {unmeasured && measure.footnote ? (
          <span className="text-xs text-muted-foreground">{measure.footnote}</span>
        ) : null}
      </Toggle>
      {help ? <HelpTip label={measure.label} help={help} /> : null}
    </div>
  )
}

function HelpTip({ label, help }: { label: string; help: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={`About ${label}`}
        className="absolute top-2.5 right-2.5 inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <InfoIcon aria-hidden="true" className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent className="max-w-64 leading-relaxed">{help}</TooltipContent>
    </Tooltip>
  )
}
