import type { SampleClient } from "@/lib/gallery/sample-data"
import { DisplayValue } from "@/registry/latent/lib/values"
import type { LatentColumnDef } from "@/registry/latent/table/lib/latent-table-features"

import { ClientStatusBadge, DateTimeCell } from "./demo-cells"

/**
 * Shared client columns. MRR sorts null LAST via `sortUndefined`: the accessor
 * maps null to undefined for the sort engine only - the cell still renders the
 * row's own null as <Unmeasured />, and a churned client's real 0 as "$0".
 */
export const CLIENT_COLUMNS: readonly LatentColumnDef<SampleClient>[] = [
  {
    id: "name",
    accessorKey: "name",
    meta: { label: "Client" },
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{row.original.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {row.original.industry}
        </span>
      </div>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    meta: { label: "Status" },
    cell: ({ row }) => <ClientStatusBadge status={row.original.status} />,
  },
  {
    id: "owner",
    accessorFn: (row) => row.owner.name,
    meta: { label: "Owner" },
  },
  {
    id: "mrr",
    accessorFn: (row) => row.mrr ?? undefined,
    sortUndefined: "last",
    meta: { label: "MRR", numeric: true },
    cell: ({ row }) => (
      <DisplayValue value={row.original.mrr} unit="currency" />
    ),
  },
  {
    id: "agents",
    accessorKey: "agents",
    meta: { label: "Agents", numeric: true },
    cell: ({ row }) => (
      <DisplayValue value={row.original.agents} unit="count" />
    ),
  },
  {
    id: "lastActivity",
    accessorKey: "lastActivity",
    meta: { label: "Last activity" },
    cell: ({ row }) => <DateTimeCell iso={row.original.lastActivity} />,
  },
]
