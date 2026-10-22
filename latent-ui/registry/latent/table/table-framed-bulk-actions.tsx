"use client"

import * as React from "react"
import type { RowData, SortingState } from "@tanstack/react-table"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TableBody, TableHeader } from "@/components/ui/table"

import type { LatentColumnDef } from "./lib/latent-table-features"
import { LatentTableScrollRegion } from "./lib/latent-table-scroll-region"
import { LatentBodyRows, LatentHeaderRows } from "./lib/latent-table-sections"
import { selectColumn } from "./lib/latent-table-select-column"
import {
  LatentTableEmpty,
  LatentTableLiveStatus,
} from "./lib/latent-table-states"
import { useLatentTable } from "./lib/use-latent-table"
import { BulkActionBar, type BulkAction } from "./table-bulk-action-bar"

export type { BulkAction }

const HEADER_TEXT = "text-xs font-medium text-muted-foreground"
/**
 * `border-separate` is required, not stylistic: Tailwind's preflight collapses
 * table borders, and a collapsed border on a sticky <th> detaches from the cell
 * on scroll. Separate borders live on each cell's own box, so every rule is on
 * the CELL (a <tr> border does not paint in separate mode). Horizontal rules
 * only: vertical dividers turn a table into "jail cells" (the venue CRM table.tsx).
 */
const TABLE = "w-full min-w-max border-separate border-spacing-0 text-sm"
const HEAD_CELL = "h-8 border-b border-border px-3"
const BODY_CELL = "h-10 border-b border-border px-3 py-2"
const BODY_ROW = "border-0 hover:bg-muted/50 data-[state=selected]:bg-muted/60"

export type TableFramedBulkActionsProps<TData extends RowData> = {
  data: readonly TData[]
  columns: readonly LatentColumnDef<TData>[]
  getRowId: (row: TData) => string
  /** Names a row for its checkbox label, e.g. the client's name. Keep it stable. */
  getRowLabel: (row: TData) => string
  bulkActions: readonly BulkAction<TData>[]
  /** Accessible name of the scroll region, e.g. "Clients". */
  label: string
  /** Must set a max-height: the header only sticks inside a bounded scroller. */
  maxHeightClassName?: string
  rowNoun?: { one: string; other: string }
  initialSorting?: SortingState
  loading?: boolean
  emptyState?: React.ReactNode
}

/**
 * Framed table: a card frame, a sticky header inside the table's own bounded
 * scroll region, hairline horizontal rules, a row-count footer, and a floating
 * bulk-action pill while rows are selected. Ported from the venue CRM
 * `components/data-table/data-table.tsx` + `components/ui/table.tsx`.
 */
export function TableFramedBulkActions<TData extends RowData>({
  data,
  columns,
  getRowId,
  getRowLabel,
  bulkActions,
  label,
  maxHeightClassName = "max-h-80",
  rowNoun = { one: "row", other: "rows" },
  initialSorting,
  loading = false,
  emptyState,
}: TableFramedBulkActionsProps<TData>) {
  const allColumns = React.useMemo(
    () => [selectColumn(getRowLabel), ...columns],
    [columns, getRowLabel]
  )
  const table = useLatentTable({
    data,
    columns: allColumns,
    getRowId,
    initialSorting,
    enableRowSelection: true,
  })
  const rowCount = table.getRowModel().rows.length
  const selected = table.getSelectedRowModel().rows.map((row) => row.original)

  return (
    <Card className="gap-0 rounded-lg py-0">
      <div className="relative">
        <LatentTableScrollRegion label={label} className={maxHeightClassName}>
          <LatentTableLiveStatus loading={loading} />
          <table className={TABLE} aria-busy={loading || undefined}>
            <TableHeader className="sticky top-0 z-10 bg-muted [&_tr]:border-b-0">
              <LatentHeaderRows
                table={table}
                rowClassName="hover:bg-transparent"
                cellClassName={HEAD_CELL}
                textClassName={HEADER_TEXT}
              />
            </TableHeader>
            <TableBody className="[&>tr:last-child>td]:border-b-0">
              <LatentBodyRows
                table={table}
                loading={loading}
                empty={
                  emptyState ?? <LatentTableEmpty title="Nothing here yet" />
                }
                cellClassName={BODY_CELL}
                skeletonRowClassName=""
                rowProps={(row) => ({
                  "data-state": row.getIsSelected() ? "selected" : undefined,
                  className: BODY_ROW,
                })}
              />
            </TableBody>
          </table>
        </LatentTableScrollRegion>
        <BulkActionBar
          selected={selected}
          actions={bulkActions}
          onClear={() => table.resetRowSelection()}
        />
      </div>
      <div className="flex items-center gap-2 border-t px-4 py-2 text-sm text-muted-foreground tabular-nums">
        {loading ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          <span aria-live="polite">{`${rowCount} ${rowCount === 1 ? rowNoun.one : rowNoun.other}`}</span>
        )}
      </div>
    </Card>
  )
}
