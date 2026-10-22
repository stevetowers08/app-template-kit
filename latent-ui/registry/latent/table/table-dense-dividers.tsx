"use client"

import type * as React from "react"
import type { RowData, SortingState } from "@tanstack/react-table"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

import { cellAlignClass } from "./lib/latent-table-columns"
import type { LatentColumnDef } from "./lib/latent-table-features"
import { LatentBodyRows, LatentHeaderRows } from "./lib/latent-table-sections"
import {
  LatentTableEmpty,
  LatentTableLiveStatus,
} from "./lib/latent-table-states"
import { useLatentTable } from "./lib/use-latent-table"

/**
 * Density and dividers, stated once (ported from the tours analytics app `table-styles`):
 * a 28px header one notch under 32px body rows, a tinted header band, and
 * vertical dividers at FULL strength in the header and HALF strength in the body
 * (the same token reads fainter on the tinted band, so matching them perceptually
 * means not matching them by token). Not sticky, so plain borders are safe here.
 */
const HEADER_TEXT = "text-xs font-medium text-muted-foreground"
const HEAD_CELL = "h-7 px-3 border-e border-border last:border-e-0"
const BODY_CELL = "h-8 px-3 py-1 border-e border-border/50 last:border-e-0"

export type TableDenseDividersProps<TData extends RowData> = {
  data: readonly TData[]
  /** A column opts into the totals band by defining `footer` (sum with sumObserved, never `?? 0`). */
  columns: readonly LatentColumnDef<TData>[]
  getRowId: (row: TData) => string
  initialSorting?: SortingState
  loading?: boolean
  emptyState?: React.ReactNode
  /** Render without the frame, for a table that sits inside a card someone else owns. */
  embedded?: boolean
  /** Noun for the row-count bar, e.g. { one: "client", other: "clients" }. */
  rowNoun?: { one: string; other: string }
  totalsLabel?: string
}

/**
 * Dense table: tinted 28px header, 32px rows, half-strength vertical dividers,
 * an optional totals band, and a row-count bar when there is no totals band
 * (two counts a few pixels apart invite the reader to check they agree).
 */
export function TableDenseDividers<TData extends RowData>({
  data,
  columns,
  getRowId,
  initialSorting,
  loading = false,
  emptyState,
  embedded = false,
  rowNoun = { one: "row", other: "rows" },
  totalsLabel = "Total",
}: TableDenseDividersProps<TData>) {
  const table = useLatentTable({ data, columns, getRowId, initialSorting })
  const rowCount = table.getRowModel().rows.length
  // No totals while loading or over zero rows: a total of nothing is not a number.
  const hasTotals =
    !loading &&
    rowCount > 0 &&
    table
      .getVisibleLeafColumns()
      .some((column) => column.columnDef.footer != null)

  const body = (
    <>
      <LatentTableLiveStatus loading={loading} />
      <Table aria-busy={loading || undefined} className="text-xs">
        <TableHeader>
          <LatentHeaderRows
            table={table}
            rowClassName="border-b bg-muted hover:bg-muted"
            cellClassName={HEAD_CELL}
            textClassName={HEADER_TEXT}
          />
        </TableHeader>
        <TableBody>
          <LatentBodyRows
            table={table}
            loading={loading}
            empty={emptyState ?? <LatentTableEmpty title="No rows yet" />}
            cellClassName={BODY_CELL}
            rowProps={() => ({ className: "hover:bg-accent/50" })}
          />
        </TableBody>
        {hasTotals ? <DenseTotals table={table} label={totalsLabel} /> : null}
      </Table>
      {hasTotals ? null : (
        <div
          className="border-t px-3 py-1.5 text-xs text-muted-foreground tabular-nums"
          aria-live="polite"
        >
          {loading ? (
            <Skeleton className="h-3.5 w-16" />
          ) : (
            `${rowCount} ${rowCount === 1 ? rowNoun.one : rowNoun.other}`
          )}
        </div>
      )}
    </>
  )

  if (embedded) return <div className="flex flex-col">{body}</div>
  return <Card className="gap-0 rounded-lg py-0">{body}</Card>
}

/**
 * The totals band: identical to a body row except for the rule above it, so it
 * reads as data rather than a second header. The label rides on the first cell
 * that has a value. Columns without `footer` stay blank - a blank is the honest
 * answer for a measure that cannot be totalled.
 */
function DenseTotals<TData extends RowData>({
  table,
  label,
}: {
  table: ReturnType<typeof useLatentTable<TData>>
  label: string
}) {
  return (
    <TableFooter className="border-t border-border bg-card font-normal">
      {table.getFooterGroups().map((group) => {
        const labelIndex = group.headers.findIndex(
          (footer) => footer.column.columnDef.footer != null
        )
        return (
          <TableRow key={group.id} className="hover:bg-card">
            {group.headers.map((footer, index) => (
              <TableCell
                key={footer.id}
                className={cn(
                  BODY_CELL,
                  cellAlignClass(footer.column.columnDef.meta)
                )}
              >
                {footer.column.columnDef.footer ? (
                  <>
                    {index === labelIndex ? (
                      <span className="me-1.5 text-muted-foreground">
                        {label}
                      </span>
                    ) : null}
                    <table.FlexRender footer={footer} />
                  </>
                ) : null}
              </TableCell>
            ))}
          </TableRow>
        )
      })}
    </TableFooter>
  )
}
