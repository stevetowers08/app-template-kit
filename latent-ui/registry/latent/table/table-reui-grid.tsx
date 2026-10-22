"use client"

import * as React from "react"
import {
  useTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table"
import { SearchIcon, Settings2Icon } from "lucide-react"

import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

/**
 * ReUI columns. Put the column's name in `meta.headerTitle` and render
 * `<DataGridColumnHeader column={column} />` without a `title`: the header and
 * the Columns menu then read the same label, stated once.
 */
export type ReuiGridColumn<TData extends object> = ColumnDef<
  DataGridFeatures,
  TData,
  unknown
>

export type TableReuiGridProps<TData extends object> = {
  data: readonly TData[]
  columns: readonly ReuiGridColumn<TData>[]
  getRowId: (row: TData) => string
  /** Enables the search box. Receives the lower-cased query. */
  searchFilter?: (row: TData, query: string) => boolean
  searchPlaceholder?: string
  toolbarActions?: React.ReactNode
  pageSize?: number
  initialSorting?: SortingState
  /** Skeleton rows come from each column's `meta.skeleton`. */
  loading?: boolean
  emptyMessage?: React.ReactNode
}

/**
 * ReUI Data Grid with a toolbar line above (search, actions, column visibility)
 * and pagination below. ReUI defaults otherwise: row borders and a header rule,
 * no cell borders, no header band, a sort and column menu on each header.
 * Ported from system-front-end `components/records-table.tsx`, on TanStack v9.
 */
export function TableReuiGrid<TData extends object>({
  data,
  columns,
  getRowId,
  searchFilter,
  searchPlaceholder = "Search",
  toolbarActions,
  pageSize = 5,
  initialSorting = [],
  loading = false,
  emptyMessage,
}: TableReuiGridProps<TData>) {
  const [search, setSearch] = React.useState("")
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting)

  // Memoised: this is TanStack's `data`, and a fresh array per render rebuilds the row model.
  const rows = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    return query && searchFilter
      ? data.filter((row) => searchFilter(row, query))
      : data
  }, [data, search, searchFilter])

  const table = useTable({
    features: dataGridFeatures,
    columns: columns as ReuiGridColumn<TData>[],
    data: rows as TData[],
    getRowId: (row) => getRowId(row),
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  })

  return (
    <DataGrid
      table={table}
      recordCount={rows.length}
      isLoading={loading}
      emptyMessage={emptyMessage}
      tableLayout={{ columnsVisibility: true }}
    >
      <div className="flex w-full flex-col gap-3">
        <div
          role="toolbar"
          aria-label="Table controls"
          className="flex flex-wrap items-center gap-2"
        >
          {searchFilter ? (
            <InputGroup className="w-full max-w-64">
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                aria-label={searchPlaceholder}
                placeholder={searchPlaceholder}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPagination((previous) => ({ ...previous, pageIndex: 0 }))
                }}
              />
            </InputGroup>
          ) : null}
          <div className="ms-auto flex items-center gap-2">
            {toolbarActions}
            <DataGridColumnVisibility
              table={table}
              trigger={
                <Button variant="outline">
                  <Settings2Icon data-icon="inline-start" aria-hidden="true" />
                  Columns
                </Button>
              }
            />
          </div>
        </div>
        <DataGridContainer>
          <DataGridScrollArea>
            <DataGridTable />
          </DataGridScrollArea>
        </DataGridContainer>
        <DataGridPagination />
      </div>
    </DataGrid>
  )
}
