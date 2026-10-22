import type * as React from "react"
import { ArrowRightIcon, InfoIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * CardHeaderBarInfotip - a bordered ~44px header bar: optional icon, title,
 * an optional subtitle (behind an (i) tooltip, or inline on the same line),
 * an optional badge, then a right-hand cluster of actions and/or a
 * "View all" link. Renders a whole Card (`p-0`), body below the bar.
 *
 * Dedupes three near-identical bordered-bar headers that only differed in
 * where the subtitle goes:
 * - tours analytics app ChartCard (+ table-card) - subtitle behind an InfoTip
 * - SEO app VisibilityCard - subtitle inline, same line as the title
 * - tours analytics app CardSectionHeader (+ FeedCard.tsx) - badge + "View all ->" link, no subtitle
 */
export type CardHeaderBarInfotipProps = {
  /** Small glyph before the title. Rendered at 16px, muted. */
  icon?: React.ReactNode
  title: string
  /** Extra context for the title. Placement is controlled by `subtitlePlacement`. */
  subtitle?: React.ReactNode
  /** "tooltip" (default when a subtitle is given) hides it behind an (i) button; "inline" prints it beside the title. */
  subtitlePlacement?: "tooltip" | "inline"
  /** Static status badge, e.g. `<Badge variant="outline">Beta</Badge>`. */
  badge?: React.ReactNode
  /** Right-hand cluster: toggles, icon buttons. Rendered before `viewAllHref`. */
  actions?: React.ReactNode
  /** Renders a "View all" link at the far right of the bar. */
  viewAllHref?: string
  /** Card body, below the bar. */
  children?: React.ReactNode
  className?: string
}

export function CardHeaderBarInfotip({
  icon,
  title,
  subtitle,
  subtitlePlacement = "tooltip",
  badge,
  actions,
  viewAllHref,
  children,
  className,
}: CardHeaderBarInfotipProps) {
  return (
    <Card className={cn("p-0", className)}>
      <div className="flex min-h-11 items-center gap-2 border-b px-(--card-spacing) py-2.5">
        {icon ? (
          <span aria-hidden="true" className="text-muted-foreground [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
        <h3 className="truncate text-sm font-medium">{title}</h3>
        {subtitle && subtitlePlacement === "tooltip" ? (
          <Tooltip>
            <TooltipTrigger
              render={<Button variant="ghost" size="icon-xs" aria-label={`About ${title}`} />}
            >
              <InfoIcon aria-hidden="true" className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>{subtitle}</TooltipContent>
          </Tooltip>
        ) : null}
        {subtitle && subtitlePlacement === "inline" ? (
          <span className="truncate text-sm text-muted-foreground">{subtitle}</span>
        ) : null}
        {badge}
        <div className="ml-auto flex items-center gap-2">
          {actions}
          {viewAllHref ? (
            <a
              href={viewAllHref}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all
              <ArrowRightIcon aria-hidden="true" className="size-3" />
            </a>
          ) : null}
        </div>
      </div>
      {children ? <div className="p-(--card-spacing)">{children}</div> : null}
    </Card>
  )
}
