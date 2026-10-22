import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
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

import { formatDuePhrase, getInitials, isPastDue } from "./lib/list-format"

export type ListTaskRow = {
  readonly id: string
  readonly title: string
  readonly client: string
  readonly due: string | null
  readonly assignee: { readonly name: string } | null
  readonly done: boolean
}

/**
 * Task rows with a done toggle and a due sentence: "Due <Weekday>, N days
 * late" once overdue, "No due date" when unset, "Unassigned" with no
 * assignee. `now` is a prop (an ISO string), never `Date.now()`, so a
 * consumer decides the clock and a demo can pin it to SAMPLE_NOW.
 *
 * Source: the task tracker app `task-line` (`TaskLine`).
 */
export function ListTaskRows({
  rows,
  now,
  onToggle,
}: {
  rows: readonly ListTaskRow[]
  now: string
  onToggle?: (id: string, done: boolean) => void
}) {
  return (
    <ItemGroup className="gap-1">
      {rows.map((row) => {
        const late = !row.done && isPastDue(row.due, now)
        return (
          <Item key={row.id} className="items-start px-2">
            <ItemMedia className="pt-0.5">
              <Checkbox
                checked={row.done}
                onCheckedChange={(checked) => onToggle?.(row.id, checked)}
                aria-label={row.done ? `Mark "${row.title}" as not done` : `Mark "${row.title}" as done`}
              />
            </ItemMedia>
            <ItemContent>
              <ItemTitle className={cn(row.done && "text-muted-foreground line-through")}>{row.title}</ItemTitle>
              <ItemDescription className={cn(late && "text-destructive")}>
                {row.client} · {row.done ? "Completed" : formatDuePhrase(row.due, now)}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              {row.assignee ? (
                <Avatar size="sm" title={row.assignee.name}>
                  <AvatarFallback>{getInitials(row.assignee.name)}</AvatarFallback>
                </Avatar>
              ) : (
                <span className="text-xs text-muted-foreground">Unassigned</span>
              )}
            </ItemActions>
          </Item>
        )
      })}
    </ItemGroup>
  )
}
