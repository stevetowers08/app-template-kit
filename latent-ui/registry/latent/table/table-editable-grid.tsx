"use client"

import type { ColumnDef, RowData } from "@tanstack/react-table"

import { DataGrid } from "@/components/data-grid/data-grid"
import { useDataGrid } from "@/hooks/use-data-grid"
import type { DataGridFeatures } from "@/lib/data-grid-features"
import type { CellOpts } from "@/lib/data-grid-types"

/**
 * Editable columns: `meta.cell` picks the editor ("short-text", "number",
 * "select", "checkbox", "date", ...). A number cell cleared by the user writes
 * null, never 0.
 */
export type EditableGridColumn<TData extends RowData> = ColumnDef<
  DataGridFeatures,
  TData,
  unknown
>

/**
 * Build an editable column with its label stated ONCE. The Dice grid decides
 * per column whether to mount its cell editors by checking that `header` is a
 * STRING: a function header (or none - TanStack v9 fills in a default function)
 * silently renders plain, uneditable text and shows the column id as its title.
 * This helper sets the string header and `meta.label` from the same value.
 */
export function editableColumn<TData extends RowData>(
  label: string,
  cell: CellOpts,
  def: { id: string; accessorKey: keyof TData & string; size?: number }
): EditableGridColumn<TData> {
  return { ...def, header: label, meta: { label, cell } }
}

export type TableEditableGridProps<TData extends RowData> = {
  data: TData[]
  /** Receives the whole next array after every edit, paste or fill. */
  onDataChange: (next: TData[]) => void
  columns: EditableGridColumn<TData>[]
  getRowId: (row: TData) => string
  /** Appends a row; return the cell to focus. Omit to hide the "Add row" footer. */
  onRowAdd?: () => { rowIndex: number; columnId: string } | null
  /**
   * Max height in px of the grid's OWN scroll box. That box is a deliberate
   * second scroll owner (the engine virtualises rows inside it and pins its
   * header there), so it must be bounded rather than grow with the page.
   */
  height?: number
  readOnly?: boolean
}

/**
 * Spreadsheet-style editable grid (Dice UI data-grid): bordered frame, sticky
 * header inside the grid's own bounded scroller, keyboard cell navigation,
 * typed cell editors, range selection, copy/paste, a context menu, Ctrl+F
 * search and an "Add row" footer; rows are virtualised.
 * Ported from the task tracker app `data-grid`.
 */
export function TableEditableGrid<TData extends RowData>({
  data,
  onDataChange,
  columns,
  getRowId,
  onRowAdd,
  height = 360,
  readOnly = false,
}: TableEditableGridProps<TData>) {
  const grid = useDataGrid({
    data,
    columns,
    onDataChange,
    getRowId: (row) => getRowId(row),
    onRowAdd: onRowAdd ? () => onRowAdd() : undefined,
    enableSearch: true,
    readOnly,
  })
  return <DataGrid {...grid} height={height} stretchColumns />
}
