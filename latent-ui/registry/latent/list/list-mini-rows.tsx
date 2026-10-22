import { Item, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item"
import { cn } from "@/lib/utils"

import { formatCompactDate, isPastDue } from "./lib/list-format"

export type ListMiniRow = {
  readonly id: string
  readonly href?: string
  readonly title: string
  readonly due: string | null
  readonly priority?: "high" | "medium" | "low"
}

const PRIORITY_DOT: Record<NonNullable<ListMiniRow["priority"]>, string> = {
  high: "bg-destructive",
  medium: "bg-amber-500",
  low: "bg-muted-foreground",
}

/**
 * Compact dot rows with a monospaced due date, no border, hover tint only.
 * The dot alone never carries the priority meaning - it is paired with an
 * `sr-only` label so it is not colour-only.
 *
 * Source: the ops dashboard `page` (`MiniRow`).
 */
export function ListMiniRows({ rows, now }: { rows: readonly ListMiniRow[]; now: string }) {
  return (
    <ItemGroup className="gap-0">
      {rows.map((row) => {
        const late = isPastDue(row.due, now)
        const compact = formatCompactDate(row.due)
        return (
          <Item
            key={row.id}
            size="sm"
            render={row.href ? <a href={row.href} /> : undefined}
            className="rounded-md border-transparent px-2 py-1.5 hover:bg-muted/60"
          >
            <span
              aria-hidden="true"
              className={cn("size-1.5 shrink-0 rounded-full", row.priority ? PRIORITY_DOT[row.priority] : "bg-border")}
            />
            <ItemContent>
              <ItemTitle className="text-sm font-normal">
                {row.title}
                {row.priority ? <span className="sr-only">, {row.priority} priority</span> : null}
              </ItemTitle>
            </ItemContent>
            <span
              className={cn(
                "font-mono text-xs tabular-nums",
                late ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {compact ?? "No due date"}
            </span>
          </Item>
        )
      })}
    </ItemGroup>
  )
}
