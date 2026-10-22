import type * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { DisplayValue, formatValue, type ValueUnit } from "@/registry/latent/lib/values"

import { DELTA_TEXT_CLASS, DeltaIcon, resolveDelta, type ResolvedDelta, type StatMeasure } from "./stat-delta"

/**
 * shadcn's dashboard-01 "section cards", as the task tracker app's SummaryCards and the tours analytics app's design
 * option A use them: label, large tabular value, a badge top-right, optional footer, on a
 * faint primary-to-card gradient.
 *
 * The badge is either the change (arrow, sign, tone) or, for a share, its "N of M". A share
 * always carries its denominator, because 3 of 3 and 18 of 18 print the same percentage.
 * The share's percentage is computed here from part and whole, so the two cannot disagree.
 */

export type Share = { readonly part: number | null; readonly whole: number | null }

type ValueForm = { value: number | null; unit: ValueUnit; share?: never }
type ShareForm = { share: Share; value?: never; unit?: never }

export type StatCardGradientBadgeProps = Omit<StatMeasure, "value" | "unit"> &
  (ValueForm | ShareForm) & {
    /** Muted line in the card footer, e.g. the period or what the figure leaves out. */
    footer?: React.ReactNode
    className?: string
  }

function shareRatio({ part, whole }: Share): number | null {
  if (part === null || whole === null || whole === 0) return null
  if (part > whole) throw new Error(`stat-card-gradient-badge: share part ${part} exceeds whole ${whole}`)
  return part / whole
}

export function StatCardGradientBadge(props: StatCardGradientBadgeProps) {
  const { label, footer, className, currency } = props
  const value = props.share ? shareRatio(props.share) : props.value
  const unit: ValueUnit = props.share ? "percent" : props.unit
  const delta = props.share ? null : resolveDelta({ ...props, value })

  return (
    <Card className={cn("@container/card bg-linear-to-t from-primary/5 to-card", className)}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          <DisplayValue value={value} unit={unit} currency={currency} />
        </CardTitle>
        <CornerBadge share={props.share} delta={delta} />
      </CardHeader>
      {footer ? <CardFooter className="text-sm text-muted-foreground">{footer}</CardFooter> : null}
    </Card>
  )
}

function CornerBadge({ share, delta }: { share?: Share; delta: ResolvedDelta | null }) {
  if (share) {
    const { part, whole } = share
    if (part === null || whole === null) return null
    return (
      <CardAction>
        <Badge variant="outline" className="tabular-nums">
          {formatValue(part, "count")} of {formatValue(whole, "count")}
        </Badge>
      </CardAction>
    )
  }
  if (!delta) return null
  return (
    <CardAction>
      <Badge variant="outline" className={cn("tabular-nums", DELTA_TEXT_CLASS[delta.tone])}>
        <DeltaIcon direction={delta.delta.direction} />
        <span aria-hidden="true">{delta.text}</span>
        <span className="sr-only">{delta.description}</span>
      </Badge>
    </CardAction>
  )
}
