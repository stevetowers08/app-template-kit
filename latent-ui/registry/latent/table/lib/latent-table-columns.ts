import type { Column, RowData } from "@tanstack/react-table"

import { cn } from "@/lib/utils"

import type {
  LatentColumnMeta,
  LatentTableFeatures,
} from "./latent-table-features"

type AnyColumn<TData extends RowData> = Column<
  LatentTableFeatures,
  TData,
  unknown
>

/**
 * A column has ONE alignment, applied to header and cells from the same fact
 * (vault Data Tables & Grids, "Numeric cell formatting"). Numbers go right so
 * digits line up by place value; everything else reads left.
 */
export function columnAlign(
  meta: LatentColumnMeta | undefined
): "left" | "right" | "center" {
  if (meta?.numeric) return "right"
  return meta?.align ?? "left"
}

const TEXT_ALIGN = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const
const JUSTIFY = {
  left: "justify-start",
  right: "justify-end",
  center: "justify-center",
} as const

/** Classes for a header or body cell: alignment, plus tabular figures on numbers. */
export function cellAlignClass(meta: LatentColumnMeta | undefined): string {
  return cn(TEXT_ALIGN[columnAlign(meta)], meta?.numeric && "tabular-nums")
}

/** Flex justification for a header whose content is a button row, not plain text. */
export function headerJustifyClass(meta: LatentColumnMeta | undefined): string {
  return JUSTIFY[columnAlign(meta)]
}

/**
 * `aria-sort` belongs on the `<th>`, never on the button inside it. Sortable but
 * unsorted columns say "none" so a reader knows the header is a sort control.
 */
export function ariaSort<TData extends RowData>(
  column: AnyColumn<TData>
): "ascending" | "descending" | "none" | undefined {
  if (!column.getCanSort()) return undefined
  const sorted = column.getIsSorted()
  if (sorted === "asc") return "ascending"
  if (sorted === "desc") return "descending"
  return "none"
}

/** The column's label, read from its definition (never collected at render time). */
export function columnLabel<TData extends RowData>(
  column: AnyColumn<TData>
): string {
  return column.columnDef.meta?.label ?? column.id
}
