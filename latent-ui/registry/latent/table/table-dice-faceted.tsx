"use client"

import type * as React from "react"
import type { Column, ColumnDef, RowData } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDataTable } from "@/hooks/use-data-table"
import type { QueryKeys } from "@/lib/data-table-types"
import type { DataTableFeatures } from "@/lib/table-features"

import {
  LatentTableEmpty,
  LatentTableEmptyRow,
  LatentTableLiveStatus,
  LatentTableSkeletonRows,
} from "./lib/latent-table-states"
import { useDiceClientRows } from "./table-dice-faceted-rows"

declare module "@/lib/data-table-types" {
  interface DataTableColumnMeta {
    /** Right-align header and cells and use tabular figures (numbers compared down a column). */
    numeric?: boolean
  }
}

export type DiceFacetedColumn<TData extends RowData> = ColumnDef<
  DataTableFeatures,
  TData,
  unknown
>

/** One alignment fact per column, for the header and the cells alike. */
const NUMERIC_HEAD = "text-right [&>button]:ms-auto [&>button]:w-fit"
const NUMERIC_CELL = "text-right tabular-nums"

/**
 * Column header that reads the label from `meta.label`, so the header, the
 * faceted filter button and the View menu share one stated name. Every column
 * also needs an explicit `id`: it is the URL key for its filter and sort.
 */
export function DiceHeader<TData extends RowData>({
  column,
}: {
  column: Column<DataTableFeatures, TData, unknown>
}) {
  return (
    <DataTableColumnHeader
      column={column}
      label={column.columnDef.meta?.label ?? column.id}
    />
  )
}

/**
 * URL keys for page, page size, sort, advanced filters and join operator.
 * Each filterable column ALSO owns a URL key equal to its `id`. Only one Dice
 * UI data table can sit on a page unless each gets its own keys.
 */
export const DICE_DEFAULT_KEYS: QueryKeys = {
  page: "page",
  perPage: "perPage",
  sort: "sort",
  filters: "filters",
  joinOperator: "joinOperator",
}

export type TableDiceFacetedProps<TData extends RowData> = {
  /** Every row, in memory. For server data, query from the same search params instead. */
  data: readonly TData[]
  columns: readonly DiceFacetedColumn<TData>[]
  getRowId: (row: TData) => string
  queryKeys?: QueryKeys
  pageSize?: number
  loading?: boolean
  emptyState?: React.ReactNode
  toolbarActions?: React.ReactNode
}

/**
 * Dice UI (tablecn) data table: faceted filter buttons with live counts, a reset
 * chip and a View menu above; the table in a bordered frame; page-size and page
 * controls below. All state (page, size, sort, filters) lives in the URL via
 * nuqs, so a filtered view is a shareable link.
 */
export function TableDiceFaceted<TData extends RowData>({
  data,
  columns,
  getRowId,
  queryKeys = DICE_DEFAULT_KEYS,
  pageSize = 5,
  loading = false,
  emptyState,
  toolbarActions,
}: TableDiceFacetedProps<TData>) {
  const { rows, pageCount, matched } = useDiceClientRows(
    data,
    columns,
    queryKeys,
    pageSize
  )
  const { table } = useDataTable({
    data: rows,
    columns: columns as DiceFacetedColumn<TData>[],
    pageCount,
    queryKeys,
    getRowId: (row) => getRowId(row),
    initialState: { pagination: { pageIndex: 0, pageSize } },
  })
  const visible = table.getRowModel().rows
  const columnCount = table.getVisibleLeafColumns().length

  return (
    <div className="flex w-full flex-col gap-2.5">
      <DataTableToolbar table={table}>{toolbarActions}</DataTableToolbar>
      <LatentTableLiveStatus loading={loading} />
      <div className="overflow-hidden rounded-md border">
        <Table aria-busy={loading || undefined}>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={
                        header.column.columnDef.meta?.numeric
                          ? NUMERIC_HEAD
                          : undefined
                      }
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : header.column.getCanSort()
                              ? "none"
                              : undefined
                      }
                    >
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <LatentTableSkeletonRows
                columnCount={columnCount}
                rowCount={pageSize}
                rowClassName="border-b"
                cellClassName="p-2"
              />
            ) : visible.length === 0 ? (
              <LatentTableEmptyRow colSpan={columnCount}>
                {data.length > 0 && matched === 0 ? (
                  <LatentTableEmpty
                    title="No matches"
                    description="No rows match the filters. Reset them to see everything."
                  />
                ) : (
                  (emptyState ?? <LatentTableEmpty title="Nothing here yet" />)
                )}
              </LatentTableEmptyRow>
            ) : (
              visible.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.columnDef.meta?.numeric
                          ? NUMERIC_CELL
                          : undefined
                      }
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {loading ? null : (
        <DataTablePagination table={table} pageSizeOptions={[5, 10, 20]} />
      )}
    </div>
  )
}
