import type * as React from "react"

import {
  Stat,
  StatDescription,
  StatIndicator,
  StatLabel,
  StatSeparator,
  StatTrend,
  StatValue,
} from "@/components/ui/stat"
import { cn } from "@/lib/utils"
import { DisplayValue } from "@/registry/latent/lib/values"

import { DeltaText, resolveDelta, type StatMeasure } from "./stat-delta"

/**
 * Built on Dice UI's Stat primitive (components/ui/stat.tsx): label with an icon indicator
 * spanning the first two rows, value, trend line, a separator and a description.
 *
 * Dice UI's StatTrend colours up green and down red with fixed palette classes, which is
 * wrong for a higher-is-worse measure and ignores the look. The trend here is rendered
 * with no `trend` prop and the shared DeltaText supplies the token colour, arrow and sign.
 */

export type StatCardDiceProps = StatMeasure & {
  icon?: React.ComponentType<{ className?: string }>
  /** Line under the separator. Defaults to the footnote. */
  description?: React.ReactNode
  className?: string
}

export function StatCardDice({ icon: Icon, description, className, ...measure }: StatCardDiceProps) {
  const delta = resolveDelta(measure)
  const note = description ?? measure.footnote

  return (
    <Stat className={cn("shadow-surface", className)}>
      <StatLabel>{measure.label}</StatLabel>
      {Icon ? (
        <StatIndicator variant="icon" color="default">
          <Icon aria-hidden="true" />
        </StatIndicator>
      ) : null}
      <StatValue className="tabular-nums">
        <DisplayValue value={measure.value} unit={measure.unit} currency={measure.currency} />
      </StatValue>
      {delta ? (
        <StatTrend>
          <DeltaText delta={delta} />
        </StatTrend>
      ) : null}
      {note ? (
        <>
          <StatSeparator />
          <StatDescription>{note}</StatDescription>
        </>
      ) : null}
    </Stat>
  )
}
