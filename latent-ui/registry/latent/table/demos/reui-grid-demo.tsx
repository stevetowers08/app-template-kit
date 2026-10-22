"use client"

import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { Skeleton } from "@/components/ui/skeleton"
import { SAMPLE_RUNS, type SampleRun } from "@/lib/gallery/sample-data"
import { DisplayValue } from "@/registry/latent/lib/values"
import {
  TableReuiGrid,
  type ReuiGridColumn,
} from "@/registry/latent/table/table-reui-grid"

import { Cents, DateTimeCell, RunStatusBadge } from "./demo-cells"
import { DemoStateToggle, rowsFor, useDemoState } from "./demo-state-toggle"

/** Numbers: one alignment fact for header and cell, plus tabular figures. */
const NUMERIC = {
  headerClassName: "text-right [&>div]:justify-end",
  cellClassName: "text-right tabular-nums",
}
const bar = (width: string) => <Skeleton className={`h-4 ${width}`} />

const COLUMNS: readonly ReuiGridColumn<SampleRun>[] = [
  {
    id: "task",
    accessorKey: "task",
    size: 240,
    header: ({ column }) => <DataGridColumnHeader column={column} visibility />,
    meta: { headerTitle: "Task", skeleton: bar("w-40") },
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{row.original.task}</span>
        <span className="truncate text-xs text-muted-foreground">
          {row.original.agent}
        </span>
      </div>
    ),
  },
  {
    id: "client",
    accessorKey: "client",
    size: 180,
    header: ({ column }) => <DataGridColumnHeader column={column} visibility />,
    meta: { headerTitle: "Client", skeleton: bar("w-28") },
  },
  {
    id: "status",
    accessorKey: "status",
    size: 140,
    header: ({ column }) => <DataGridColumnHeader column={column} visibility />,
    meta: { headerTitle: "Status", skeleton: bar("w-20") },
    cell: ({ row }) => <RunStatusBadge status={row.original.status} />,
  },
  {
    id: "startedAt",
    accessorKey: "startedAt",
    size: 140,
    header: ({ column }) => <DataGridColumnHeader column={column} visibility />,
    meta: { headerTitle: "Started", skeleton: bar("w-24") },
    cell: ({ row }) => <DateTimeCell iso={row.original.startedAt} />,
  },
  {
    id: "durationMs",
    accessorFn: (row) => row.durationMs ?? undefined,
    sortUndefined: "last",
    size: 110,
    header: ({ column }) => <DataGridColumnHeader column={column} visibility />,
    meta: {
      headerTitle: "Duration",
      skeleton: bar("ms-auto w-12"),
      ...NUMERIC,
    },
    cell: ({ row }) => (
      <DisplayValue value={row.original.durationMs} unit="duration-ms" />
    ),
  },
  {
    id: "cost",
    accessorFn: (row) => row.cost ?? undefined,
    sortUndefined: "last",
    size: 100,
    header: ({ column }) => <DataGridColumnHeader column={column} visibility />,
    meta: { headerTitle: "Cost", skeleton: bar("ms-auto w-12"), ...NUMERIC },
    cell: ({ row }) => <Cents value={row.original.cost} />,
  },
]

const searchRuns = (row: SampleRun, query: string) =>
  [row.task, row.agent, row.client].some((text) =>
    text.toLowerCase().includes(query)
  )

export function ReuiGridDemo() {
  const [state, setState] = useDemoState()
  return (
    <div>
      <DemoStateToggle value={state} onChange={setState} />
      <TableReuiGrid
        data={rowsFor(state, SAMPLE_RUNS)}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        searchFilter={searchRuns}
        searchPlaceholder="Search runs"
        initialSorting={[{ id: "startedAt", desc: true }]}
        loading={state === "loading"}
        emptyMessage="No runs yet. Runs appear here as soon as an agent starts one."
      />
    </div>
  )
}
