import type * as React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"

export type ListHoverRow = {
  readonly id: string
  readonly href?: string
  readonly title: string
  readonly meta: string
  readonly primaryFigure: React.ReactNode
  readonly secondaryFigure?: React.ReactNode
}

/**
 * Borderless rows inside one Card: no per-row border, a hover tint only, and
 * tabular figures stacked right instead of a trailing single value.
 *
 * Source: the tours analytics app `CapacityChangesList`
 * (`<Item size="sm" className="hover:bg-accent/60">`).
 */
export function ListHoverRows({ title, rows }: { title?: string; rows: readonly ListHoverRow[] }) {
  return (
    <Card className="py-2">
      {title ? (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className="px-2">
        <ItemGroup className="gap-0">
          {rows.map((row) => (
            <Item
              key={row.id}
              size="sm"
              render={row.href ? <a href={row.href} /> : undefined}
              className="rounded-md hover:bg-muted/60"
            >
              <ItemContent>
                <ItemTitle className="truncate">{row.title}</ItemTitle>
                <ItemDescription>{row.meta}</ItemDescription>
              </ItemContent>
              <div className="flex flex-col items-end text-right">
                <span className="text-sm font-medium tabular-nums">{row.primaryFigure}</span>
                {row.secondaryFigure ? (
                  <span className="text-xs text-muted-foreground tabular-nums">{row.secondaryFigure}</span>
                ) : null}
              </div>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}
