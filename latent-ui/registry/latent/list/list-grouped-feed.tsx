import type * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"

export type ListGroupedFeedRow = {
  readonly id: string
  readonly href?: string
  readonly icon: React.ReactNode
  readonly headline: string
  readonly meta: string
  readonly badge?: {
    readonly label: string
    readonly variant?: "default" | "secondary" | "outline" | "destructive"
  }
}

export type ListGroupedFeedGroup = {
  readonly id: string
  readonly label: string
  readonly rows: readonly ListGroupedFeedRow[]
}

/**
 * One Card per group (e.g. a day), a tinted group header with a dot and
 * count, then divide-y event rows.
 *
 * Source: the tours analytics app `news-feed`.
 */
export function ListGroupedFeed({ groups }: { groups: readonly ListGroupedFeedGroup[] }) {
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <Card key={group.id} className="gap-0 overflow-hidden py-0">
          <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{group.label}</span>
            <span className="text-xs text-muted-foreground">{group.rows.length}</span>
          </div>
          <ItemGroup className="gap-0 divide-y divide-border">
            {group.rows.map((row) => (
              <Item
                key={row.id}
                variant="default"
                size="sm"
                render={row.href ? <a href={row.href} /> : undefined}
                className="rounded-none px-4 hover:bg-muted/40"
              >
                <ItemMedia variant="icon">{row.icon}</ItemMedia>
                <ItemContent>
                  <ItemTitle>{row.headline}</ItemTitle>
                  <ItemDescription>{row.meta}</ItemDescription>
                </ItemContent>
                {row.badge ? (
                  <ItemActions>
                    <Badge variant={row.badge.variant ?? "outline"}>{row.badge.label}</Badge>
                  </ItemActions>
                ) : null}
              </Item>
            ))}
          </ItemGroup>
        </Card>
      ))}
    </div>
  )
}
