"use client"

import type * as React from "react"
import type { Row, RowData } from "@tanstack/react-table"

import { TableCell, TableHead, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

import { ariaSort, cellAlignClass } from "./latent-table-columns"
import type { LatentTableFeatures } from "./latent-table-features"
import { LatentHeaderContent } from "./latent-table-sort-header"
import {
  LatentTableEmptyRow,
  LatentTableSkeletonRows,
} from "./latent-table-states"
import type { useLatentTable } from "./use-latent-table"

type LatentTable<TData extends RowData> = ReturnType<
  typeof useLatentTable<TData>
>
type LatentRow<TData extends RowData> = Row<LatentTableFeatures, TData>

/**
 * The header and body loops every own-markup variant shares, so the rules live
 * once: `aria-sort` on each <th>, one alignment per column for header and cells,
 * the label-driven sort header, skeleton rows in the real table while loading,
 * and the empty body. A variant only supplies its classes and any extra leading
 * or trailing cells (a tree gutter, a row-actions column).
 */
export function LatentHeaderRows<TData extends RowData>({
  table,
  rowClassName,
  cellClassName,
  textClassName,
  leading,
  trailing,
}: {
  table: LatentTable<TData>
  rowClassName?: string
  cellClassName?: string
  /** Header typography, applied to the <th> and inherited by the sort button. */
  textClassName?: string
  leading?: React.ReactNode
  trailing?: React.ReactNode
}) {
  return table.getHeaderGroups().map((group) => (
    <TableRow key={group.id} className={rowClassName}>
      {leading}
      {group.headers.map((header) => (
        <TableHead
          key={header.id}
          aria-sort={ariaSort(header.column)}
          style={{ width: header.column.columnDef.meta?.width }}
          className={cn(
            cellClassName,
            textClassName,
            cellAlignClass(header.column.columnDef.meta)
          )}
        >
          <LatentHeaderContent header={header} textClassName={textClassName} />
        </TableHead>
      ))}
      {trailing}
    </TableRow>
  ))
}

export function LatentBodyRows<TData extends RowData>({
  table,
  loading,
  empty,
  cellClassName,
  rowProps,
  leadingCell,
  trailingCell,
  skeletonRowClassName = "border-b",
  skeletonRowCount,
}: {
  table: LatentTable<TData>
  loading: boolean
  /** Body shown when there are no rows. */
  empty: React.ReactNode
  cellClassName?: string
  rowProps?: (row: LatentRow<TData>) => React.ComponentProps<"tr">
  leadingCell?: (row: LatentRow<TData>) => React.ReactNode
  trailingCell?: (row: LatentRow<TData>) => React.ReactNode
  skeletonRowClassName?: string
  skeletonRowCount?: number
}) {
  const rows = table.getRowModel().rows
  const numeric = table
    .getVisibleLeafColumns()
    .map((column) => Boolean(column.columnDef.meta?.numeric))
  const allNumeric = [
    ...(leadingCell ? [false] : []),
    ...numeric,
    ...(trailingCell ? [false] : []),
  ]

  if (loading) {
    return (
      <LatentTableSkeletonRows
        columnCount={allNumeric.length}
        rowCount={skeletonRowCount}
        numeric={allNumeric}
        rowClassName={skeletonRowClassName}
        cellClassName={cellClassName}
      />
    )
  }
  if (rows.length === 0)
    return (
      <LatentTableEmptyRow colSpan={allNumeric.length}>
        {empty}
      </LatentTableEmptyRow>
    )

  return rows.map((row) => (
    <TableRow key={row.id} {...rowProps?.(row)}>
      {leadingCell?.(row)}
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          className={cn(
            cellClassName,
            cellAlignClass(cell.column.columnDef.meta)
          )}
        >
          <table.FlexRender cell={cell} />
        </TableCell>
      ))}
      {trailingCell?.(row)}
    </TableRow>
  ))
}
