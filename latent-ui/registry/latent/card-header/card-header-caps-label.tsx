import type * as React from "react"

import { Card } from "@/components/ui/card"

/**
 * CardHeaderCapsLabel - the flattest header: an uppercase micro-label, no
 * divider, body directly beneath. Renders a whole Card (label row + optional
 * body); Card's own `--card-spacing` gap does the vertical rhythm, so no
 * extra margin is invented here.
 *
 * Source: ops dashboard `globals` `.section-label` used directly inside a padded
 * Card (KpiCard, ChartCard, AnalyticsTable) - the dominant card-header idiom
 * in that repo, 42 occurrences across 13 files.
 */
export type CardHeaderCapsLabelProps = {
  /** Short, 1-4 word label. Rendered uppercase and tracked - keep it brief. */
  label: string
  /** Right-aligned slot on the label row (e.g. a Button or a date-range control). */
  actions?: React.ReactNode
  /** Card body, directly below the label row. */
  children?: React.ReactNode
  className?: string
}

export function CardHeaderCapsLabel({
  label,
  actions,
  children,
  className,
}: CardHeaderCapsLabelProps) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between gap-2 px-(--card-spacing)">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </h3>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="px-(--card-spacing)">{children}</div> : null}
    </Card>
  )
}
