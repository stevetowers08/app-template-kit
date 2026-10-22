"use client"

import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SAMPLE_CLIENTS, type SampleClient } from "@/lib/gallery/sample-data"
import { DisplayValue } from "@/registry/latent/lib/values"
import type { LatentColumnDef } from "@/registry/latent/table/lib/latent-table-features"
import { LatentTableEmpty } from "@/registry/latent/table/lib/latent-table-states"
import { TableTitledCard } from "@/registry/latent/table/table-titled-card"

import { ClientStatusBadge } from "./demo-cells"
import { DemoStateToggle, rowsFor, useDemoState } from "./demo-state-toggle"

const COLUMNS: readonly LatentColumnDef<SampleClient>[] = [
  { id: "name", accessorKey: "name", meta: { label: "Client" } },
  {
    id: "owner",
    accessorFn: (row) => row.owner.name,
    meta: { label: "Owner" },
  },
  {
    id: "status",
    accessorKey: "status",
    meta: { label: "Status" },
    cell: ({ row }) => <ClientStatusBadge status={row.original.status} />,
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
]

export function TitledCardDemo() {
  const [state, setState] = useDemoState("empty")
  const addButton = (
    <Button variant="outline" size="sm">
      <PlusIcon data-icon="inline-start" aria-hidden="true" />
      Add client
    </Button>
  )
  return (
    <div>
      <DemoStateToggle value={state} onChange={setState} />
      <TableTitledCard
        title="Clients"
        action={addButton}
        data={rowsFor(state, SAMPLE_CLIENTS)}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        loading={state === "loading"}
        emptyState={
          <LatentTableEmpty
            title="No clients yet"
            description="Add your first client to start tracking agents and billing."
            action={addButton}
          />
        }
      />
    </div>
  )
}
