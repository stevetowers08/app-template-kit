"use client"

import type { QueryKeys } from "@/lib/data-table-types"
import { SAMPLE_RUNS, type SampleRun } from "@/lib/gallery/sample-data"
import { DisplayValue } from "@/registry/latent/lib/values"
import {
  DiceHeader,
  TableDiceFaceted,
  type DiceFacetedColumn,
} from "@/registry/latent/table/table-dice-faceted"

import {
  Cents,
  DateTimeCell,
  RUN_STATUS_OPTIONS,
  RunStatusBadge,
} from "./demo-cells"
import { DemoStateToggle, rowsFor, useDemoState } from "./demo-state-toggle"

/**
 * URL keys this demo owns. The page/size/sort keys are prefixed so they cannot
 * collide with the gallery's own keys (look, card-header, stat-card, table,
 * list); each filterable column's id is ALSO a URL key: task, agent, status.
 */
const RUN_KEYS: QueryKeys = {
  page: "runsPage",
  perPage: "runsPerPage",
  sort: "runsSort",
  filters: "runsFilters",
  joinOperator: "runsJoin",
}

/** Facet counts come from the full row set, so each option says how many rows it holds. */
function countBy(key: (run: SampleRun) => string) {
  const counts = new Map<string, number>()
  for (const run of SAMPLE_RUNS)
    counts.set(key(run), (counts.get(key(run)) ?? 0) + 1)
  return counts
}
const statusCounts = countBy((run) => run.status)
const agentCounts = countBy((run) => run.agent)

const COLUMNS: readonly DiceFacetedColumn<SampleRun>[] = [
  {
    id: "task",
    accessorKey: "task",
    header: DiceHeader,
    meta: { label: "Task", placeholder: "Filter tasks", variant: "text" },
    enableColumnFilter: true,
    enableHiding: false,
  },
  {
    id: "agent",
    accessorKey: "agent",
    header: DiceHeader,
    meta: {
      label: "Agent",
      variant: "multiSelect",
      options: [...agentCounts].map(([agent, count]) => ({
        label: agent,
        value: agent,
        count,
      })),
    },
    enableColumnFilter: true,
  },
  {
    id: "status",
    accessorKey: "status",
    header: DiceHeader,
    meta: {
      label: "Status",
      variant: "multiSelect",
      options: RUN_STATUS_OPTIONS.map((option) => ({
        ...option,
        count: statusCounts.get(option.value) ?? 0,
      })),
    },
    enableColumnFilter: true,
    cell: ({ row }) => <RunStatusBadge status={row.original.status} />,
  },
  {
    id: "client",
    accessorKey: "client",
    header: DiceHeader,
    meta: { label: "Client" },
  },
  {
    id: "startedAt",
    accessorKey: "startedAt",
    header: DiceHeader,
    meta: { label: "Started" },
    cell: ({ row }) => <DateTimeCell iso={row.original.startedAt} />,
  },
  {
    id: "durationMs",
    accessorKey: "durationMs",
    header: DiceHeader,
    meta: { label: "Duration", numeric: true },
    cell: ({ row }) => (
      <DisplayValue value={row.original.durationMs} unit="duration-ms" />
    ),
  },
  {
    id: "cost",
    accessorKey: "cost",
    header: DiceHeader,
    meta: { label: "Cost", numeric: true },
    cell: ({ row }) => <Cents value={row.original.cost} />,
  },
]

export function DiceFacetedDemo() {
  const [state, setState] = useDemoState()
  return (
    <div>
      <DemoStateToggle value={state} onChange={setState} />
      <TableDiceFaceted
        data={rowsFor(state, SAMPLE_RUNS)}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        queryKeys={RUN_KEYS}
        loading={state === "loading"}
      />
    </div>
  )
}
