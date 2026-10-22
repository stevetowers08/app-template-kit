import type * as React from "react"
import { ChevronRightIcon } from "lucide-react"

import { IconTile } from "@/components/reui/icon-tile"
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

export type ListRecordRow = {
  readonly id: string
  readonly href: string
  readonly icon: React.ReactNode
  readonly title: string
  readonly subtitle: string
  readonly badge?: {
    readonly label: string
    readonly variant?: "default" | "secondary" | "outline" | "destructive"
  }
}

/**
 * Flat record rows: an icon tile, title, subtitle, an optional status badge
 * and a trailing chevron. No per-row border (flush-panel archetype).
 *
 * Source: the venue CRM `RecordList`, `RecordListItem`
 * `variant="row"`.
 */
export function ListRecordRows({ rows }: { rows: readonly ListRecordRow[] }) {
  return (
    <ItemGroup className="gap-0">
      {rows.map((row) => (
        <Item key={row.id} render={<a href={row.href} />} className="rounded-md px-2">
          <ItemMedia>
            <IconTile size="sm">{row.icon}</IconTile>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{row.title}</ItemTitle>
            <ItemDescription>{row.subtitle}</ItemDescription>
          </ItemContent>
          <ItemActions>
            {row.badge ? <Badge variant={row.badge.variant ?? "secondary"}>{row.badge.label}</Badge> : null}
            <ChevronRightIcon className="text-muted-foreground" />
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  )
}
