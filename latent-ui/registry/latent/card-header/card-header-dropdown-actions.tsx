import type * as React from "react"
import { MoreVerticalIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

/**
 * CardHeaderDropdownActions - a static status badge on the left, an overflow
 * menu on the right, in a bordered top bar. Renders a whole Card (`p-0`).
 *
 * Source: ReUI `@reui/c-card-16` "Card with header badge and actions" -
 * status Badge left, `DropdownMenu` overflow trigger right, `border-b`.
 */
export type CardHeaderDropdownActionsProps = {
  /** Static status badge, e.g. `<Badge variant="secondary">Live</Badge>`. */
  status: React.ReactNode
  /** Accessible name for the overflow-menu trigger. */
  menuLabel?: string
  /** `<DropdownMenuItem>` elements for the overflow menu. */
  menuItems: React.ReactNode
  /** Card body, below the bar. */
  children?: React.ReactNode
  className?: string
}

export function CardHeaderDropdownActions({
  status,
  menuLabel = "More options",
  menuItems,
  children,
  className,
}: CardHeaderDropdownActionsProps) {
  return (
    <Card className={cn("p-0", className)}>
      <div className="flex items-center justify-between gap-2 border-b px-(--card-spacing) py-2.5">
        {status}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={menuLabel}
                className="text-muted-foreground"
              />
            }
          >
            <MoreVerticalIcon aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">{menuItems}</DropdownMenuContent>
        </DropdownMenu>
      </div>
      {children ? <div className="p-(--card-spacing)">{children}</div> : null}
    </Card>
  )
}
