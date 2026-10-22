"use client"

import type * as React from "react"
import type { RowData, SortingState } from "@tanstack/react-table"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

import type { LatentColumnDef } from "./lib/latent-table-features"
import { LatentBodyRows, LatentHeaderRows } from "./lib/latent-table-sections"
import {
  LatentTableEmpty,
  LatentTableLiveStatus,
} from "./lib/latent-table-states"
import { useLatentTable } from "./lib/use-latent-table"

/**
 * The flush financial table (vault Design System/Stripe.md): no outer box, no
 * vertical rules, a bottom border per row only, the canvas showing through, and
 * every money cell right-aligned in tabular figures. The header is quiet small
 * text, not a band.
 */
const HEADER_TEXT = "text-xs font-medium text-muted-foreground"
const CELL = "px-3 py-2.5 first:ps-0 last:pe-0"

/**
 * Row actions are revealed on hover (Linear/Stripe), but never hover-ONLY: they
 * also appear when anything in the row has keyboard focus, and are always shown
 * on devices without hover, so keyboard and touch users can reach them.
 */
const ACTIONS_REVEAL =
  "opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100 [@media(hover:none)]:opacity-100"

export type TableStripeFlushProps<TData extends RowData> = {
  data: readonly TData[]
  columns: readonly LatentColumnDef<TData>[]
  getRowId: (row: TData) => string
  /** Per-row actions (a menu button with an aria-label), pinned to the row's end. */
  rowActions?: (row: TData) => React.ReactNode
  /** Noun for the result count under the table, e.g. { one: "run", other: "runs" }. */
  rowNoun?: { one: string; other: string }
  initialSorting?: SortingState
  loading?: boolean
  emptyState?: React.ReactNode
}

export function TableStripeFlush<TData extends RowData>({
  data,
  columns,
  getRowId,
  rowActions,
  rowNoun = { one: "result", other: "results" },
  initialSorting,
  loading = false,
  emptyState,
}: TableStripeFlushProps<TData>) {
  const table = useLatentTable({ data, columns, getRowId, initialSorting })
  const rowCount = table.getRowModel().rows.length

  return (
    <div className="flex flex-col">
      <LatentTableLiveStatus loading={loading} />
      <Table aria-busy={loading || undefined}>
        <TableHeader>
          <LatentHeaderRows
            table={table}
            rowClassName="hover:bg-transparent"
            cellClassName={cn("h-9", CELL, "py-0")}
            textClassName={HEADER_TEXT}
            trailing={
              rowActions ? (
                <TableHead className={cn("h-9 w-10", CELL, "py-0")}>
                  <span className="sr-only">Actions</span>
                </TableHead>
              ) : null
            }
          />
        </TableHeader>
        <TableBody className="[&_tr:last-child]:border-b">
          <LatentBodyRows
            table={table}
            loading={loading}
            empty={emptyState ?? <LatentTableEmpty title="No results" />}
            cellClassName={CELL}
            rowProps={() => ({ className: "group/row hover:bg-muted/40" })}
            trailingCell={
              rowActions
                ? (row) => (
                    <TableCell className={cn(CELL, "py-1 text-right")}>
                      <div className={ACTIONS_REVEAL}>
                        {rowActions(row.original)}
                      </div>
                    </TableCell>
                  )
                : undefined
            }
          />
        </TableBody>
      </Table>
      <div
        className="pt-3 text-sm text-muted-foreground tabular-nums"
        aria-live="polite"
      >
        {loading ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          `${rowCount} ${rowCount === 1 ? rowNoun.one : rowNoun.other}`
        )}
      </div>
    </div>
  )
}
