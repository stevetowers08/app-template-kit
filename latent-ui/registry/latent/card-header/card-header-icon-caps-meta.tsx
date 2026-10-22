import type * as React from "react"

import { Card } from "@/components/ui/card"

/**
 * CardHeaderIconCapsMeta - icon + uppercase micro-label + muted meta on one
 * line, actions pinned right. No divider. Renders a whole Card; body sits
 * below the header row, spaced by Card's own `--card-spacing` gap.
 *
 * Source: ops dashboard `SectionHeader` `SectionHeader({icon, label,
 * meta, right})` - doubles as a card/section header across 8 files.
 */
export type CardHeaderIconCapsMetaProps = {
  /** Small glyph, e.g. `<ZapIcon />`. Rendered at 16px, muted. */
  icon?: React.ReactNode
  /** Short, 1-4 word label. Rendered uppercase and tracked. */
  label: string
  /** Short muted context after the label, e.g. a count or a timeframe. */
  meta?: React.ReactNode
  /** Right-aligned slot, pinned with `ml-auto`. */
  actions?: React.ReactNode
  /** Card body, directly below the header row. */
  children?: React.ReactNode
  className?: string
}

export function CardHeaderIconCapsMeta({
  icon,
  label,
  meta,
  actions,
  children,
  className,
}: CardHeaderIconCapsMetaProps) {
  return (
    <Card className={className}>
      <div className="flex items-center gap-2 px-(--card-spacing)">
        {icon ? (
          <span aria-hidden="true" className="text-muted-foreground [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </h3>
        {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
        {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="px-(--card-spacing)">{children}</div> : null}
    </Card>
  )
}
