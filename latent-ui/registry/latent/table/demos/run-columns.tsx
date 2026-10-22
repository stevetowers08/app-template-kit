import type { SampleRun } from "@/lib/gallery/sample-data"
import { DisplayValue } from "@/registry/latent/lib/values"
import type { LatentColumnDef } from "@/registry/latent/table/lib/latent-table-features"
import { LatentTruncatedText } from "@/registry/latent/table/lib/latent-table-truncated-text"

import { Cents, DateTimeCell, RunStatusBadge } from "./demo-cells"

/**
 * Shared agent-run columns. Duration and cost are null while a run is in flight
 * or when the provider did not report usage: they render <Unmeasured />, and
 * sort after every measured value (`sortUndefined: "last"`), never as 0.
 */
export const RUN_COLUMNS: readonly LatentColumnDef<SampleRun>[] = [
  {
    id: "id",
    accessorKey: "id",
    meta: { label: "Run", width: "9%" },
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.id}
      </span>
    ),
  },
  { id: "agent", accessorKey: "agent", meta: { label: "Agent", width: "15%" } },
  {
    id: "task",
    accessorKey: "task",
    enableSorting: false,
    meta: { label: "Task", width: "22%" },
    cell: ({ row }) => (
      <LatentTruncatedText>{row.original.task}</LatentTruncatedText>
    ),
  },
  {
    id: "client",
    accessorKey: "client",
    meta: { label: "Client", width: "17%" },
  },
  {
    id: "status",
    accessorKey: "status",
    meta: { label: "Status", width: "14%" },
    cell: ({ row }) => <RunStatusBadge status={row.original.status} />,
  },
  {
    id: "startedAt",
    accessorKey: "startedAt",
    meta: { label: "Started", width: "11%" },
    cell: ({ row }) => <DateTimeCell iso={row.original.startedAt} />,
  },
  {
    id: "durationMs",
    accessorFn: (row) => row.durationMs ?? undefined,
    sortUndefined: "last",
    meta: { label: "Duration", numeric: true, width: "7%" },
    cell: ({ row }) => (
      <DisplayValue value={row.original.durationMs} unit="duration-ms" />
    ),
  },
  {
    id: "cost",
    accessorFn: (row) => row.cost ?? undefined,
    sortUndefined: "last",
    meta: { label: "Cost", numeric: true, width: "7%" },
    cell: ({ row }) => <Cents value={row.original.cost} />,
  },
]
