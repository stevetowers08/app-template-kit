"use client"

import {
  SAMPLE_CLIENTS,
  SAMPLE_RUNS,
  type SampleRun,
} from "@/lib/gallery/sample-data"
import { DisplayValue } from "@/registry/latent/lib/values"
import type { LatentColumnDef } from "@/registry/latent/table/lib/latent-table-features"
import {
  countObserved,
  sumObserved,
} from "@/registry/latent/table/lib/latent-table-totals"
import { TableTreeGutter } from "@/registry/latent/table/table-tree-gutter"

import { Cents, DateTimeCell, RunStatusBadge } from "./demo-cells"

/**
 * Clients as parents, their agent runs as children. Parent cells aggregate over
 * the children (vault Data Tables & Grids, "what a collapsed group row shows"):
 * a run count (always true, and 0 is a real count), the cost SUM of what was
 * reported with "n of m" when partial, the latest start, and the status only
 * when every run agrees - otherwise the word "Mixed", never an invented value.
 */
type ClientNode = {
  kind: "client"
  id: string
  name: string
  runs: readonly SampleRun[]
  children: TreeRow[]
}
type RunNode = { kind: "run"; id: string; run: SampleRun }
type TreeRow = ClientNode | RunNode

const TREE: readonly TreeRow[] = SAMPLE_CLIENTS.map((client) => {
  const runs = SAMPLE_RUNS.filter((run) => run.client === client.name)
  return {
    kind: "client",
    id: client.id,
    name: client.name,
    runs,
    children: runs.map((run) => ({ kind: "run", id: run.id, run })),
  }
})

const costOf = (row: TreeRow) =>
  row.kind === "run"
    ? row.run.cost
    : sumObserved(row.runs.map((run) => run.cost))
const latestStart = (runs: readonly SampleRun[]) =>
  runs.reduce<string | null>(
    (latest, run) =>
      latest === null || run.startedAt > latest ? run.startedAt : latest,
    null
  )

function GroupStatus({ runs }: { runs: readonly SampleRun[] }) {
  if (runs.length === 0)
    return <span className="text-muted-foreground">No runs</span>
  const first = runs[0].status
  if (runs.every((run) => run.status === first))
    return <RunStatusBadge status={first} />
  return <span className="text-muted-foreground">Mixed</span>
}

function GroupCost({ runs }: { runs: readonly SampleRun[] }) {
  const values = runs.map((run) => run.cost)
  const observed = countObserved(values)
  return (
    <>
      <Cents value={sumObserved(values)} />
      {observed > 0 && observed < values.length ? (
        <span className="ms-1 text-xs text-muted-foreground">
          ({observed} of {values.length})
        </span>
      ) : null}
    </>
  )
}

const COLUMNS: readonly LatentColumnDef<TreeRow>[] = [
  {
    id: "name",
    accessorFn: (row) => (row.kind === "client" ? row.name : row.run.task),
    meta: { label: "Client / run" },
    cell: ({ row }) =>
      row.original.kind === "client" ? (
        <span className="font-medium">{row.original.name}</span>
      ) : (
        <span>
          {row.original.run.task}
          <span className="text-muted-foreground">
            {" "}
            · {row.original.run.agent}
          </span>
        </span>
      ),
  },
  {
    id: "runs",
    accessorFn: (row) => (row.kind === "client" ? row.runs.length : undefined),
    meta: { label: "Runs", numeric: true },
    cell: ({ row }) =>
      row.original.kind === "client" ? (
        <DisplayValue value={row.original.runs.length} unit="count" />
      ) : null,
  },
  {
    id: "status",
    enableSorting: false,
    meta: { label: "Status" },
    cell: ({ row }) =>
      row.original.kind === "client" ? (
        <GroupStatus runs={row.original.runs} />
      ) : (
        <RunStatusBadge status={row.original.run.status} />
      ),
  },
  {
    id: "startedAt",
    accessorFn: (row) =>
      row.kind === "client"
        ? (latestStart(row.runs) ?? undefined)
        : row.run.startedAt,
    sortUndefined: "last",
    meta: { label: "Latest start" },
    cell: ({ row }) => {
      const iso =
        row.original.kind === "client"
          ? latestStart(row.original.runs)
          : row.original.run.startedAt
      return iso === null ? (
        <span className="text-muted-foreground">No runs</span>
      ) : (
        <DateTimeCell iso={iso} />
      )
    },
  },
  {
    id: "cost",
    accessorFn: (row) => costOf(row) ?? undefined,
    sortUndefined: "last",
    meta: { label: "Cost", numeric: true },
    cell: ({ row }) =>
      row.original.kind === "client" ? (
        <GroupCost runs={row.original.runs} />
      ) : (
        <Cents value={row.original.run.cost} />
      ),
  },
]

const subRows = (row: TreeRow) =>
  row.kind === "client" && row.children.length > 0 ? row.children : undefined
const rowLabel = (row: TreeRow) =>
  row.kind === "client" ? row.name : row.run.task

export function TreeGutterDemo() {
  return (
    <TableTreeGutter
      data={TREE}
      columns={COLUMNS}
      getRowId={(row) => row.id}
      getSubRows={subRows}
      getRowLabel={rowLabel}
      childNoun="runs"
      rowNoun={{ one: "client", other: "clients" }}
      initialSorting={[{ id: "cost", desc: true }]}
    />
  )
}
