import type * as React from "react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const DOT_TONE = {
  default: "bg-muted-foreground",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
} as const

/**
 * CardHeaderInlineDot - a status dot beside the title, an optional badge
 * inline with it, controls pinned right. No divider. Renders a whole Card;
 * the dot is decorative only (`aria-hidden`) - the title/badge text carries
 * the actual status, per WCAG 1.4.1 (colour is never the only signal).
 *
 * Source: Pulse `components/portfolio/BookShapeCard.tsx` and similar - a dot
 * + `text-base font-semibold` title + badge, controls right. Pattern repeats
 * across 17 files with no shared component.
 */
export type CardHeaderInlineDotProps = {
  title: string
  /** Colours the dot. Purely decorative - pair with a badge or the title text for the real signal. */
  tone?: keyof typeof DOT_TONE
  /** Inline badge next to the title, e.g. `<Badge variant="outline">Live</Badge>`. */
  badge?: React.ReactNode
  /** Right-aligned controls, pinned with `ml-auto`. */
  actions?: React.ReactNode
  /** Card body, below the header row. */
  children?: React.ReactNode
  className?: string
}

export function CardHeaderInlineDot({
  title,
  tone = "default",
  badge,
  actions,
  children,
  className,
}: CardHeaderInlineDotProps) {
  return (
    <Card className={className}>
      <div className="flex items-center gap-2 px-(--card-spacing)">
        <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", DOT_TONE[tone])} />
        <h3 className="truncate text-sm font-semibold">{title}</h3>
        {badge}
        {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="px-(--card-spacing)">{children}</div> : null}
    </Card>
  )
}
