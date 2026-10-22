"use client"

import { SAMPLE_CLIENTS, type SampleClient } from "@/lib/gallery/sample-data"
import { DisplayValue } from "@/registry/latent/lib/values"
import type { LatentColumnDef } from "@/registry/latent/table/lib/latent-table-features"
import {
  countObserved,
  sumObserved,
} from "@/registry/latent/table/lib/latent-table-totals"
import { TableDenseDividers } from "@/registry/latent/table/table-dense-dividers"

import { ClientStatusBadge } from "./demo-cells"
import { DemoStateToggle, rowsFor, useDemoState } from "./demo-state-toggle"

/**
 * MRR totals only what was measured and says how much that was: 7 of 8 clients
 * report MRR (Bay Grammar has no billing yet), so the band reads "$16,200 (7 of 8)"
 * rather than passing a partial sum off as complete.
 */
const COLUMNS: readonly LatentColumnDef<SampleClient>[] = [
  { id: "name", accessorKey: "name", meta: { label: "Client" } },
  { id: "industry", accessorKey: "industry", meta: { label: "Industry" } },
  {
    id: "status",
    accessorKey: "status",
    meta: { label: "Status" },
    cell: ({ row }) => <ClientStatusBadge status={row.original.status} />,
  },
  {
    id: "agents",
    accessorKey: "agents",
    meta: { label: "Agents", numeric: true },
    cell: ({ row }) => (
      <DisplayValue value={row.original.agents} unit="count" />
    ),
    footer: ({ table }) => (
      <DisplayValue
        value={sumObserved(
          table.getRowModel().rows.map((row) => row.original.agents)
        )}
        unit="count"
      />
    ),
  },
  {
    id: "mrr",
    accessorFn: (row) => row.mrr ?? undefined,
    sortUndefined: "last",
    meta: { label: "MRR", numeric: true },
    cell: ({ row }) => (
      <DisplayValue value={row.original.mrr} unit="currency" />
    ),
    footer: ({ table }) => {
      const values = table.getRowModel().rows.map((row) => row.original.mrr)
      const observed = countObserved(values)
      return (
        <>
          <DisplayValue value={sumObserved(values)} unit="currency" />
          {observed < values.length ? (
            <span className="ms-1 text-muted-foreground">
              ({observed} of {values.length})
            </span>
          ) : null}
        </>
      )
    },
  },
]

export function DenseDividersDemo() {
  const [state, setState] = useDemoState()
  return (
    <div>
      <DemoStateToggle value={state} onChange={setState} />
      <TableDenseDividers
        data={rowsFor(state, SAMPLE_CLIENTS)}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        initialSorting={[{ id: "mrr", desc: true }]}
        loading={state === "loading"}
        rowNoun={{ one: "client", other: "clients" }}
      />
    </div>
  )
}
