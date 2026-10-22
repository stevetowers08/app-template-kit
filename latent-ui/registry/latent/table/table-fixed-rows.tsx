"use client"

import type * as React from "react"
import type { RowData, SortingState } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableHeader } from "@/components/ui/table"
import { cn } from "@/lib/utils"

import type { LatentColumnDef } from "./lib/latent-table-features"
import { LatentBodyRows, LatentHeaderRows } from "./lib/latent-table-sections"
import {
  LatentTableEmpty,
  LatentTableLiveStatus,
} from "./lib/latent-table-states"
import { useLatentTable } from "./lib/use-latent-table"

/**
 * Three rules baked in rather than left to call sites (Pulse `components/ui/table.tsx`):
 * 1. ONE LINE PER ROW: `table-fixed` makes declared widths authoritative and every
 *    cell truncates, so a long value ellipses instead of making one row taller.
 * 2. ONE ROW HEIGHT: it lives on the row (36px, or 24px dense); cells carry no
 *    vertical padding, so content cannot vary it.
 * 3. NUMBERS ARE RIGHT-ALIGNED AND TABULAR: `meta.numeric` does both.
 * Below md, columns size to content and the table scrolls sideways instead of
 * truncating every cell to nothing on a phone. The header is not sticky: inside
 * the table's horizontal overflow box it could only stick to that box.
 */
const HEADER_TEXT =
  "text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
const ROW_HEIGHT = { compact: "h-9", dense: "h-6" } as const
const PHONE_LAYOUT = "max-md:table-auto max-md:w-max max-md:min-w-full"

export type TableFixedRowsProps<TData extends RowData> = {
  data: readonly TData[]
  /** Give columns `meta.width` (e.g. "22%"): under table-fixed the widths are authoritative. */
  columns: readonly LatentColumnDef<TData>[]
  getRowId: (row: TData) => string
  title?: React.ReactNode
  actions?: React.ReactNode
  /** `dense` (24px rows) is for fixed-height widgets inside an already padded card. */
  density?: "compact" | "dense"
  initialSorting?: SortingState
  loading?: boolean
  emptyState?: React.ReactNode
}

/**
 * Fixed-row table in a no-padding shell: a toolbar strip (title, count badge,
 * actions) over 36px single-line rows with truncation, a caps micro-header and
 * right-aligned tabular numbers. The shell is the ONLY box around the table.
 */
export function TableFixedRows<TData extends RowData>({
  data,
  columns,
  getRowId,
  title,
  actions,
  density = "compact",
  initialSorting,
  loading = false,
  emptyState,
}: TableFixedRowsProps<TData>) {
  const table = useLatentTable({ data, columns, getRowId, initialSorting })
  const rowHeight = ROW_HEIGHT[density]

  return (
    <Card className="gap-0 rounded-lg py-0">
      {title || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {title ? (
              <h3 className="truncate text-sm font-semibold">{title}</h3>
            ) : null}
            {loading ? null : (
              <Badge variant="secondary" className="tabular-nums">
                {table.getRowModel().rows.length}
              </Badge>
            )}
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      <LatentTableLiveStatus loading={loading} />
      <Table
        aria-busy={loading || undefined}
        className={cn("table-fixed text-[13px]", PHONE_LAYOUT)}
      >
        <TableHeader>
          <LatentHeaderRows
            table={table}
            rowClassName="hover:bg-transparent"
            cellClassName="h-8 truncate px-3"
            textClassName={HEADER_TEXT}
          />
        </TableHeader>
        <TableBody>
          <LatentBodyRows
            table={table}
            loading={loading}
            empty={emptyState ?? <LatentTableEmpty title="Nothing here yet" />}
            cellClassName="truncate px-3 py-0"
            skeletonRowClassName={cn(rowHeight, "border-b")}
            rowProps={() => ({ className: rowHeight })}
          />
        </TableBody>
      </Table>
    </Card>
  )
}
