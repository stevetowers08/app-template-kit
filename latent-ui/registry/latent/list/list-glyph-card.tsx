import type * as React from "react"

import { IconTile } from "@/components/reui/icon-tile"
import { Badge } from "@/components/ui/badge"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { cn } from "@/lib/utils"

export type ListGlyphCardRow = {
  readonly id: string
  readonly href?: string
  readonly icon: React.ReactNode
  readonly tone?: "primary" | "success" | "warning" | "destructive"
  readonly title: string
  readonly badge?: string
  readonly description: string
  readonly actions?: React.ReactNode
  readonly selected?: boolean
}

const TONE_CLASS: Record<NonNullable<ListGlyphCardRow["tone"]>, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-amber-600 dark:text-amber-400",
  destructive: "text-destructive",
}

/**
 * A full card per row: a tinted glyph tile, a title plus badge, a two-line
 * description and trailing actions. Each row is its own card (floating-card
 * archetype), not a flush line.
 *
 * Source: the SEO app `content-card`.
 */
export function ListGlyphCard({ rows }: { rows: readonly ListGlyphCardRow[] }) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <Item
          key={row.id}
          variant="outline"
          render={row.href ? <a href={row.href} /> : undefined}
          className={cn("gap-3 py-3", row.selected && "border-primary")}
        >
          <ItemMedia>
            <IconTile variant="soft" className={row.tone ? TONE_CLASS[row.tone] : undefined}>
              {row.icon}
            </IconTile>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              {row.title}
              {row.badge ? <Badge variant="secondary">{row.badge}</Badge> : null}
            </ItemTitle>
            <ItemDescription>{row.description}</ItemDescription>
          </ItemContent>
          {row.actions ? <ItemActions>{row.actions}</ItemActions> : null}
        </Item>
      ))}
    </div>
  )
}
