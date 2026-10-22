"use client"

import * as React from "react"
import type { RowData, SortingState } from "@tanstack/react-table"

import { Card } from "@/components/ui/card"
import { Table, TableBody, TableHeader } from "@/components/ui/table"
import { cn } from "@/lib/utils"

import type { LatentColumnDef } from "./lib/latent-table-features"
import { LatentBodyRows, LatentHeaderRows } from "./lib/latent-table-sections"
import {
  LatentTableEmpty,
  LatentTableLiveStatus,
} from "./lib/latent-table-states"
import { useLatentTable } from "./lib/use-latent-table"

const HEADER_TEXT = "font-medium text-foreground"
/**
 * The first and last columns take the card's own 16px inset so text never sits
 * against the card edge; the rest keep the stock shadcn cell padding. A tighter
 * radius than Card's default: a table reads as data, not a marketing card.
 */
const CARD = cn(
  "gap-0 rounded-md py-0",
  "[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4"
)

export type TableTitledCardProps<TData extends RowData> = {
  data: readonly TData[]
  columns: readonly LatentColumnDef<TData>[]
  getRowId: (row: TData) => string
  /** Optional: a page whose own title already names the table leaves it out. */
  title?: string
  action?: React.ReactNode
  initialSorting?: SortingState
  loading?: boolean
  emptyState?: React.ReactNode
}

/**
 * Title above, table in a card: an h2 and the section's action sit on the page,
 * then a Card holding a stock shadcn Table. Every table on a settings-style page
 * uses it so they read as one set. Ported from the task tracker app `table-card`.
 */
export function TableTitledCard<TData extends RowData>({
  data,
  columns,
  getRowId,
  title,
  action,
  initialSorting,
  loading = false,
  emptyState,
}: TableTitledCardProps<TData>) {
  const titleId = React.useId()
  const table = useLatentTable({ data, columns, getRowId, initialSorting })

  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className="flex flex-col gap-3"
    >
      {title || action ? (
        <div className="flex min-h-8 items-center gap-3">
          {title ? (
            <h2 id={titleId} className="font-heading text-base">
              {title}
            </h2>
          ) : null}
          {action ? <div className="ms-auto">{action}</div> : null}
        </div>
      ) : null}
      <Card className={CARD}>
        <LatentTableLiveStatus loading={loading} />
        <Table aria-busy={loading || undefined}>
          <TableHeader>
            <LatentHeaderRows
              table={table}
              rowClassName="hover:bg-transparent"
              textClassName={HEADER_TEXT}
            />
          </TableHeader>
          <TableBody>
            <LatentBodyRows
              table={table}
              loading={loading}
              empty={
                emptyState ?? <LatentTableEmpty title="Nothing here yet" />
              }
              cellClassName="p-2"
              skeletonRowCount={3}
            />
          </TableBody>
        </Table>
      </Card>
    </section>
  )
}
