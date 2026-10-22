import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { computeDelta, formatDelta, type Delta, type ValueUnit } from "@/registry/latent/lib/values"

/**
 * Shared by every stat-card variant, so the delta rules live once:
 * - A delta exists only when computeDelta returns one (both sides measured, previous not 0).
 * - `invert` (higher is worse) flips the good/bad colour, never the arrow.
 * - Colour is never the only signal: an arrow icon and a sign always ride with it, and a
 *   screen reader gets the whole sentence ("up 13.4% on Aug 2026, worse").
 */

/** The props every variant takes for one measure. Reusable, not tied to sample data. */
export type StatMeasure = {
  readonly label: string
  /** Null means not measured. It renders as <Unmeasured />, never 0. */
  readonly value: number | null
  readonly unit: ValueUnit
  readonly previous?: number | null
  /** Higher is worse (cost, failures, wait time). */
  readonly invert?: boolean
  /** The period the delta compares against, named in full: "Aug 2026", "prior 7 days". */
  readonly comparisonLabel?: string
  /** One line of context. Shown under a null value to say why it is missing. */
  readonly footnote?: string
  readonly currency?: string
}

export type DeltaTone = "good" | "bad" | "flat"

export type ResolvedDelta = {
  readonly delta: Delta
  readonly tone: DeltaTone
  /** Visible text with its sign: "+11.9%", "-28.2%", "0%". */
  readonly text: string
  /** Full sentence for assistive tech. */
  readonly description: string
  readonly comparisonLabel?: string
}

export function resolveDelta(
  measure: Pick<StatMeasure, "value" | "previous" | "unit" | "invert" | "comparisonLabel">
): ResolvedDelta | null {
  const delta = computeDelta(measure.value, measure.previous ?? null, measure.unit)
  if (delta === null) return null
  const tone: DeltaTone =
    delta.direction === "flat" ? "flat" : (delta.direction === "up") !== Boolean(measure.invert) ? "good" : "bad"
  // formatDelta prints no sign for "flat", which gives the bare magnitude for the sentence.
  const magnitude = formatDelta({ ...delta, direction: "flat" })
  const on = measure.comparisonLabel ? ` on ${measure.comparisonLabel}` : ""
  const description =
    tone === "flat"
      ? `no change${on}`
      : `${delta.direction} ${magnitude}${on}, ${tone === "good" ? "better" : "worse"}`
  return { delta, tone, text: formatDelta(delta), description, comparisonLabel: measure.comparisonLabel }
}

/** Text colour per tone. Pairs follow the ReUI "-light" badge (legible on card in both modes). */
export const DELTA_TEXT_CLASS: Record<DeltaTone, string> = {
  good: "text-success-foreground dark:text-success",
  bad: "text-destructive-foreground dark:text-destructive",
  flat: "text-muted-foreground",
}

/** the ops dashboard's rule: only a bad change earns colour; good and flat stay quiet. */
export const QUIET_DELTA_TEXT_CLASS: Record<DeltaTone, string> = {
  good: "text-muted-foreground",
  bad: "text-destructive-foreground dark:text-destructive",
  flat: "text-muted-foreground",
}

/** ReUI badge variant per tone. */
export const DELTA_BADGE_VARIANT = {
  good: "success-light",
  bad: "destructive-light",
  flat: "secondary",
} as const satisfies Record<DeltaTone, string>

export function DeltaIcon({ direction, className }: { direction: Delta["direction"]; className?: string }) {
  const Icon = direction === "up" ? ArrowUpIcon : direction === "down" ? ArrowDownIcon : MinusIcon
  return <Icon aria-hidden="true" className={cn("size-3 shrink-0", className)} />
}

/** Arrow, signed change and "vs <period>", with the sentence for screen readers. */
export function DeltaText({
  delta,
  toneClass = DELTA_TEXT_CLASS,
  showComparison = true,
  className,
}: {
  delta: ResolvedDelta
  toneClass?: Record<DeltaTone, string>
  showComparison?: boolean
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium tabular-nums", className)}>
      <span aria-hidden="true" className={cn("inline-flex items-center gap-0.5", toneClass[delta.tone])}>
        <DeltaIcon direction={delta.delta.direction} />
        {delta.text}
      </span>
      {showComparison && delta.comparisonLabel ? (
        <span aria-hidden="true" className="font-normal text-muted-foreground">
          vs {delta.comparisonLabel}
        </span>
      ) : null}
      <span className="sr-only">{delta.description}</span>
    </span>
  )
}
