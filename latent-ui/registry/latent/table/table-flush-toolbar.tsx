"use client"

import * as React from "react"
import type { RowData, SortingState } from "@tanstack/react-table"

import { Table, TableBody, TableHeader } from "@/components/ui/table"

import type { LatentColumnDef } from "./lib/latent-table-features"
import { LatentBodyRows, LatentHeaderRows } from "./lib/latent-table-sections"
import {
  LatentTableEmpty,
  LatentTableLiveStatus,
} from "./lib/latent-table-states"
import { useLatentTable } from "./lib/use-latent-table"
import {
  FlushToolbarBar,
  type FlushToolbarFilter,
} from "./table-flush-toolbar-bar"

export type { FlushToolbarFilter }

/** 10px bold caps, widest tracking: the micro-label header (ops dashboard DataTable). */
const HEADER_TEXT =
  "text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
const CELL_PAD = { default: "px-4 py-3", compact: "px-4 py-2" } as const
const NO_FILTERS: readonly never[] = []

export type TableFlushToolbarProps<TData extends RowData> = {
  data: readonly TData[]
  columns: readonly LatentColumnDef<TData>[]
  getRowId: (row: TData) => string
  /** Enables the search box. Receives the lower-cased query. */
  searchFilter?: (row: TData, query: string) => boolean
  searchPlaceholder?: string
  filters?: readonly FlushToolbarFilter<TData>[]
  actions?: React.ReactNode
  /** `compact` keeps rows to one line without cramping them. */
  density?: "default" | "compact"
  initialSorting?: SortingState
  loading?: boolean
  /** Body when `data` is empty (nothing exists yet). */
  emptyState?: React.ReactNode
  /** Body when the toolbar filtered every row out - a different fact from "none". */
  filteredEmptyState?: React.ReactNode
}

/**
 * Toolbar + flush table: one control line on the page, then a borderless table
 * with 10px caps headers on a faint band and hairline row rules. No outer box,
 * no pagination. Ported from ops dashboard `DataTable` onto @latent columns.
 */
export function TableFlushToolbar<TData extends RowData>({
  data,
  columns,
  getRowId,
  searchFilter,
  searchPlaceholder = "Search",
  filters = NO_FILTERS,
  actions,
  density = "default",
  initialSorting,
  loading = false,
  emptyState,
  filteredEmptyState,
}: TableFlushToolbarProps<TData>) {
  const [search, setSearch] = React.useState("")
  const [filterValues, setFilterValues] = React.useState<
    Record<string, string>
  >({})
  const rows = useFilteredRows(
    data,
    search,
    searchFilter,
    filters,
    filterValues
  )
  const table = useLatentTable({
    data: rows,
    columns,
    getRowId,
    initialSorting,
  })

  const setFilter = (id: string, value: string | null) =>
    setFilterValues((previous) => {
      const next = { ...previous }
      if (value === null) delete next[id]
      else next[id] = value
      return next
    })

  const empty =
    data.length === 0
      ? (emptyState ?? <LatentTableEmpty title="Nothing here yet" />)
      : (filteredEmptyState ?? (
          <LatentTableEmpty
            title="No matches"
            description="No rows match the search or filters."
          />
        ))

  return (
    <div className="flex flex-col">
      <FlushToolbarBar
        search={searchFilter ? search : null}
        onSearchChange={setSearch}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={setFilter}
        onClear={() => {
          setSearch("")
          setFilterValues({})
        }}
        shown={loading ? null : rows.length}
        total={loading ? null : data.length}
        actions={actions}
      />
      <LatentTableLiveStatus loading={loading} />
      <Table aria-busy={loading || undefined}>
        <TableHeader>
          <LatentHeaderRows
            table={table}
            rowClassName="bg-muted/50 hover:bg-muted/50"
            cellClassName="h-auto px-4 py-2"
            textClassName={HEADER_TEXT}
          />
        </TableHeader>
        <TableBody>
          <LatentBodyRows
            table={table}
            loading={loading}
            empty={empty}
            cellClassName={CELL_PAD[density]}
          />
        </TableBody>
      </Table>
    </div>
  )
}

/**
 * Memoised on purpose: the result is TanStack's `data`, and a new array per
 * render rebuilds the row model (see useLatentTable).
 */
function useFilteredRows<TData extends RowData>(
  data: readonly TData[],
  search: string,
  searchFilter: ((row: TData, query: string) => boolean) | undefined,
  filters: readonly FlushToolbarFilter<TData>[],
  filterValues: Readonly<Record<string, string>>
): readonly TData[] {
  return React.useMemo(() => {
    const query = search.trim().toLowerCase()
    return data.filter((row) => {
      if (query && searchFilter && !searchFilter(row, query)) return false
      return filters.every((filter) => {
        const value = filterValues[filter.id]
        return value === undefined || filter.test(row, value)
      })
    })
  }, [data, search, searchFilter, filters, filterValues])
}
