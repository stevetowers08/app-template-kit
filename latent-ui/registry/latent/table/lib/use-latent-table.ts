"use client"

import {
  useTable,
  type RowData,
  type SortingState,
} from "@tanstack/react-table"

import {
  LATENT_LABEL_HEADER,
  latentTableFeatures,
  type LatentColumnDef,
} from "./latent-table-features"

export type UseLatentTableOptions<TData extends RowData> = {
  /**
   * MUST be referentially stable (memoise it in the caller, and memoise any
   * filtered copy). A fresh array every render rebuilds the row model and can
   * drive a render loop with no console error (ops dashboard DataTable, 2026).
   */
  data: readonly TData[]
  columns: readonly LatentColumnDef<TData>[]
  getRowId: (row: TData) => string
  initialSorting?: SortingState
  enableRowSelection?: boolean
  /** Synchronous children only: TanStack cannot await getSubRows. */
  getSubRows?: (row: TData) => TData[] | undefined
}

/** The one place the own-markup variants create a TanStack v9 table. */
export function useLatentTable<TData extends RowData>({
  data,
  columns,
  getRowId,
  initialSorting = [],
  enableRowSelection = false,
  getSubRows,
}: UseLatentTableOptions<TData>) {
  return useTable({
    features: latentTableFeatures,
    data: data as TData[],
    columns: columns as LatentColumnDef<TData>[],
    getRowId: (row) => getRowId(row),
    getSubRows: getSubRows ? (row) => getSubRows(row) : undefined,
    enableRowSelection,
    defaultColumn: { header: LATENT_LABEL_HEADER },
    initialState: { sorting: initialSorting },
  })
}
