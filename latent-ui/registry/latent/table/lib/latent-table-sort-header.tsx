"use client"

import {
  flexRender,
  type Column,
  type Header,
  type RowData,
} from "@tanstack/react-table"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import {
  columnAlign,
  columnLabel,
  headerJustifyClass,
} from "./latent-table-columns"
import {
  LATENT_LABEL_HEADER,
  type LatentTableFeatures,
} from "./latent-table-features"

/**
 * Header content for one column: the label, or a sort button carrying it.
 *
 * - The label comes from `meta.label`, stated once on the column definition.
 * - The direction arrow shows ONLY on the active column. Arrows on every header
 *   at once is a named anti-pattern (vault Data Tables & Grids, "Sort").
 * - `textClassName` is the variant's header typography, passed so the button
 *   reads exactly like the plain headers beside it.
 * - `aria-sort` is NOT set here: it belongs on the `<th>` (see `ariaSort`).
 * - Right-aligned (numeric) columns put the arrow first, so the label's edge
 *   stays on the same line as the numbers under it.
 */
export function LatentSortHeader<TData extends RowData>({
  column,
  textClassName,
}: {
  column: Column<LatentTableFeatures, TData, unknown>
  textClassName?: string
}) {
  const label = columnLabel(column)
  const meta = column.columnDef.meta

  if (meta?.srOnlyLabel) return <span className="sr-only">{label}</span>
  if (!column.getCanSort()) return <>{label}</>

  const sorted = column.getIsSorted()
  const Arrow =
    sorted === "asc" ? ArrowUpIcon : sorted === "desc" ? ArrowDownIcon : null
  const arrow = Arrow ? <Arrow aria-hidden="true" /> : null
  const arrowFirst = columnAlign(meta) === "right"

  return (
    <div className={cn("flex w-full min-w-0", headerJustifyClass(meta))}>
      <Button
        variant="ghost"
        size="xs"
        onClick={column.getToggleSortingHandler()}
        className={cn(
          "-mx-1.5 h-6 min-w-0 gap-1 px-1.5 text-inherit hover:bg-transparent hover:text-foreground",
          textClassName,
          sorted && "text-foreground"
        )}
      >
        {arrowFirst ? arrow : null}
        <span className="truncate">{label}</span>
        {arrowFirst ? null : arrow}
      </Button>
    </div>
  )
}

/**
 * What a `<th>` renders: the label-driven sort header for a column that declared
 * no `header`, otherwise the column's own header (e.g. a select-all checkbox).
 */
export function LatentHeaderContent<TData extends RowData>({
  header,
  textClassName,
}: {
  header: Header<LatentTableFeatures, TData, unknown>
  textClassName?: string
}) {
  if (header.isPlaceholder) return null
  const template = header.column.columnDef.header
  if (template === LATENT_LABEL_HEADER) {
    return (
      <LatentSortHeader column={header.column} textClassName={textClassName} />
    )
  }
  return <>{flexRender(template, header.getContext())}</>
}
