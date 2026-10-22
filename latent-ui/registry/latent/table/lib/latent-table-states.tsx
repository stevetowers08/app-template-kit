import type * as React from "react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/** Placeholder bar widths, cycled so the skeleton does not read as a solid block. */
const BAR_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-5/12", "w-7/12"] as const

/**
 * Loading rows inside the REAL table, never a drawing beside it: the header,
 * column count and row height stay the table's own. A compact card-sized table
 * draws 3 to 5 rows (vault Data Tables & Grids, "Loading / empty / error").
 * Each row is aria-hidden; the table carries aria-busy and one status line
 * (<LatentTableLiveStatus />) announces the load instead of every cell.
 */
export function LatentTableSkeletonRows({
  columnCount,
  rowCount = 4,
  rowClassName,
  cellClassName,
  numeric,
}: {
  columnCount: number
  rowCount?: number
  rowClassName?: string
  cellClassName?: string
  /** Per column: true puts the bar at the end edge, where that column's numbers sit. */
  numeric?: readonly boolean[]
}) {
  return (
    <>
      {Array.from({ length: rowCount }, (_, row) => (
        <tr key={row} aria-hidden="true" className={rowClassName}>
          {Array.from({ length: columnCount }, (_, col) => (
            <td key={col} className={cellClassName}>
              <Skeleton
                className={cn(
                  "h-3.5",
                  BAR_WIDTHS[(row + col) % BAR_WIDTHS.length],
                  numeric?.[col] && "ms-auto"
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/**
 * The body when there are no rows. The header stays so the reader still sees
 * what the table would hold. "No data yet" and "nothing matches your filters"
 * are different facts, so callers pass the message for their case.
 */
export function LatentTableEmptyRow({
  colSpan,
  children,
  className,
}: {
  colSpan: number
  children: React.ReactNode
  className?: string
}) {
  return (
    <tr className={cn("hover:bg-transparent", className)}>
      <td colSpan={colSpan} className="p-0">
        {children}
      </td>
    </tr>
  )
}

/** Default empty content: a title and a line, built on the shared Empty primitive. */
export function LatentTableEmpty({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <Empty className="py-10">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action}
    </Empty>
  )
}

/** One polite announcement for the whole table while rows load. */
export function LatentTableLiveStatus({
  loading,
  label = "Loading rows",
}: {
  loading: boolean
  label?: string
}) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {loading ? label : ""}
    </span>
  )
}
