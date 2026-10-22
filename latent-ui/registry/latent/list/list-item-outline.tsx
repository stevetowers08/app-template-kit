import type * as React from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { cn } from "@/lib/utils"

export type ListItemOutlineRow = {
  readonly id: string
  readonly href?: string
  readonly initials: string
  readonly title: string
  readonly meta: string
  readonly badge?: {
    readonly label: string
    readonly variant?: "default" | "secondary" | "outline" | "destructive"
  }
  readonly actions?: React.ReactNode
}

/**
 * Outlined two-line row: an avatar, a title with a status badge, a muted
 * meta line, and hover-revealed actions that stay reachable on keyboard
 * focus (`group-focus-within`, not just `group-hover`).
 *
 * Source: the ops dashboard `ListRow`, re-expressed on the
 * shadcn `Item` primitive (`variant="outline"`) instead of a hand-rolled row.
 */
export function ListItemOutline({ rows }: { rows: readonly ListItemOutlineRow[] }) {
  return (
    <ItemGroup>
      {rows.map((row) => (
        <Item key={row.id} variant="outline" render={row.href ? <a href={row.href} /> : undefined}>
          <ItemMedia variant="image">
            <Avatar size="sm">
              <AvatarFallback>{row.initials}</AvatarFallback>
            </Avatar>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              {row.title}
              {row.badge ? <Badge variant={row.badge.variant ?? "outline"}>{row.badge.label}</Badge> : null}
            </ItemTitle>
            <ItemDescription>{row.meta}</ItemDescription>
          </ItemContent>
          {row.actions ? (
            <ItemActions
              className={cn(
                "opacity-0 transition-opacity",
                "group-hover/item:opacity-100 group-focus-within/item:opacity-100"
              )}
            >
              {row.actions}
            </ItemActions>
          ) : null}
        </Item>
      ))}
    </ItemGroup>
  )
}
