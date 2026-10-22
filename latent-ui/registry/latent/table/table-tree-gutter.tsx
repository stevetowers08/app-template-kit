"use client"

import * as React from "react"
import type { Row, RowData, SortingState } from "@tanstack/react-table"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

import type {
  LatentColumnDef,
  LatentTableFeatures,
} from "./lib/latent-table-features"
import { LatentBodyRows, LatentHeaderRows } from "./lib/latent-table-sections"
import {
  LatentTableEmpty,
  LatentTableLiveStatus,
} from "./lib/latent-table-states"
import { useLatentTable } from "./lib/use-latent-table"
import {
  CHILD_ROW_TINT,
  ConnectorLine,
  ExpandToggle,
  GUTTER_CELL,
  SPLIT_HOVER,
} from "./table-tree-gutter-parts"

const HEADER_TEXT = "text-xs font-medium text-muted-foreground"
const CELL = "h-9 px-3 py-1.5"

export type TableTreeGutterProps<TData extends RowData> = {
  data: readonly TData[]
  /**
   * One column set shared by parents and children. Parent cells should show an
   * aggregate (a sum, a range, a row count), never a blank or an invented 0.
   */
  columns: readonly LatentColumnDef<TData>[]
  getRowId: (row: TData) => string
  /** Synchronous children, one level deep. Fetch-on-expand needs a detail row instead. */
  getSubRows: (row: TData) => TData[] | undefined
  /** Names a parent for the toggle's accessible label, e.g. the client name. */
  getRowLabel: (row: TData) => string
  /** What the children are, for the toggle label: "Show runs for Lumen Accounting". */
  childNoun: string
  /** Noun for the count bar; it counts top-level records, not visible rows. */
  rowNoun?: { one: string; other: string }
  initialSorting?: SortingState
  loading?: boolean
  emptyState?: React.ReactNode
}

/**
 * Tree table: a square leading gutter with a `+` toggle and a connector that
 * brackets each expanded group, children on a tinted band, and a split hover so
 * the gutter and the row read as two separate targets. Ported from the tours analytics app
 * `expandable-table.tsx` + `expand-gutter.tsx`.
 */
export function TableTreeGutter<TData extends RowData>({
  data,
  columns,
  getRowId,
  getSubRows,
  getRowLabel,
  childNoun,
  rowNoun = { one: "row", other: "rows" },
  initialSorting,
  loading = false,
  emptyState,
}: TableTreeGutterProps<TData>) {
  const domPrefix = React.useId()
  const table = useLatentTable({
    data,
    columns,
    getRowId,
    getSubRows,
    initialSorting,
  })
  const topLevel = table.getCoreRowModel().rows.length
  const domId = (row: Row<LatentTableFeatures, TData>) =>
    `${domPrefix}-${row.id}`

  return (
    <Card className="gap-0 rounded-lg py-0">
      <LatentTableLiveStatus loading={loading} />
      <Table aria-busy={loading || undefined}>
        <TableHeader>
          <LatentHeaderRows
            table={table}
            rowClassName="hover:bg-transparent"
            cellClassName="h-9 px-3"
            textClassName={HEADER_TEXT}
            leading={
              <TableHead data-expand-gutter="" className={GUTTER_CELL}>
                <span className="sr-only">Expand</span>
              </TableHead>
            }
          />
        </TableHeader>
        <TableBody>
          <LatentBodyRows
            table={table}
            loading={loading}
            empty={emptyState ?? <LatentTableEmpty title="Nothing here yet" />}
            cellClassName={CELL}
            rowProps={(row) => ({
              id: domId(row),
              className: cn(SPLIT_HOVER, row.getParentRow() && CHILD_ROW_TINT),
            })}
            leadingCell={(row) => (
              <TableCell data-expand-gutter="" className={GUTTER_CELL}>
                <GutterContent
                  row={row}
                  domId={domId}
                  label={getRowLabel(row.original)}
                  childNoun={childNoun}
                />
              </TableCell>
            )}
          />
        </TableBody>
      </Table>
      <div
        className="border-t px-3 py-2 text-xs text-muted-foreground tabular-nums"
        aria-live="polite"
      >
        {loading ? (
          <Skeleton className="h-3.5 w-16" />
        ) : (
          `${topLevel} ${topLevel === 1 ? rowNoun.one : rowNoun.other}`
        )}
      </div>
    </Card>
  )
}

/**
 * A child row carries only its connector segment (closing at its midpoint when
 * it is the last child); a parent with children carries the toggle.
 */
function GutterContent<TData extends RowData>({
  row,
  domId,
  label,
  childNoun,
}: {
  row: Row<LatentTableFeatures, TData>
  domId: (row: Row<LatentTableFeatures, TData>) => string
  label: string
  childNoun: string
}) {
  const parent = row.getParentRow()
  if (parent) {
    const isLast = parent.subRows[parent.subRows.length - 1]?.id === row.id
    return <ConnectorLine span={isLast ? "to-last" : "through"} />
  }
  if (!row.getCanExpand()) return null
  const expanded = row.getIsExpanded()
  return (
    <>
      {expanded ? <ConnectorLine span="from-toggle" /> : null}
      <span className="flex items-center justify-center">
        <ExpandToggle
          expanded={expanded}
          onToggle={() => row.toggleExpanded()}
          controls={expanded ? row.subRows.map(domId).join(" ") : undefined}
          label={label}
          childNoun={childNoun}
        />
      </span>
    </>
  )
}
