"use client"

import type { RowData } from "@tanstack/react-table"

import { Checkbox } from "@/components/ui/checkbox"

import type { LatentColumnDef } from "./latent-table-features"

/**
 * The leading row-selection column. Every checkbox has a name: "Select all rows"
 * in the header (mixed state when some are selected), "Select <row label>" per
 * row, so a screen reader never meets an unlabelled checkbox list.
 */
export function selectColumn<TData extends RowData>(
  getRowLabel: (row: TData) => string
): LatentColumnDef<TData> {
  return {
    id: "select",
    enableSorting: false,
    meta: { label: "Select", srOnlyLabel: true, width: "2.5rem" },
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all rows"
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllRowsSelected(checked)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={`Select ${getRowLabel(row.original)}`}
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(checked)}
      />
    ),
  }
}
