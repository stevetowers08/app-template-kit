import type * as React from "react"
import { ChevronRightIcon, CircleHelpIcon } from "lucide-react"

import { IconTile } from "@/components/reui/icon-tile"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { DisplayValue } from "@/registry/latent/lib/values"

/**
 * CardHeaderOutsideIcon - the heading sits OUTSIDE any card: an icon tile,
 * the title, a muted count, an optional hover-help tooltip, an optional
 * chevron to navigate to the full view, and actions on the right. Renders a
 * `<section>`, not a Card - `children` (e.g. a Card, a table) follows below.
 *
 * Source: venue CRM `Section`
 * `Section({title,description?,help?,icon?,count?,onNavigate?,actions?})`.
 */
export type CardHeaderOutsideIconProps = {
  /** Small glyph inside a 28px tile. */
  icon?: React.ReactNode
  title: string
  description?: React.ReactNode
  /** A measured count beside the title. `null` renders as "not measured", never 0. */
  count?: number | null
  /** Tooltip content behind a hover-help (?) button. */
  help?: React.ReactNode
  /** Present -> renders a chevron button that calls it to open the full view. */
  onNavigate?: () => void
  /** Right-aligned slot, pinned with `ml-auto`. */
  actions?: React.ReactNode
  /** Rendered below the heading row - a Card, a table, a list. */
  children?: React.ReactNode
  className?: string
}

export function CardHeaderOutsideIcon({
  icon,
  title,
  description,
  count,
  help,
  onNavigate,
  actions,
  children,
  className,
}: CardHeaderOutsideIconProps) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        {icon ? <IconTile size="sm">{icon}</IconTile> : null}
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {count !== undefined ? (
          <span className="text-sm text-muted-foreground">
            <DisplayValue value={count} unit="count" />
          </span>
        ) : null}
        {help ? (
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon-xs" aria-label="Help" />}>
              <CircleHelpIcon aria-hidden="true" className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>{help}</TooltipContent>
          </Tooltip>
        ) : null}
        {onNavigate ? (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Open ${title}`}
            onClick={onNavigate}
          >
            <ChevronRightIcon aria-hidden="true" className="size-3.5" />
          </Button>
        ) : null}
        {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
      </div>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      {children}
    </section>
  )
}
