"use client"

import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SAMPLE_CLIENTS, type SampleClient } from "@/lib/gallery/sample-data"
import {
  TableFlushToolbar,
  type FlushToolbarFilter,
} from "@/registry/latent/table/table-flush-toolbar"

import { CLIENT_COLUMNS } from "./client-columns"
import { CLIENT_STATUS_OPTIONS } from "./demo-cells"
import { DemoStateToggle, rowsFor, useDemoState } from "./demo-state-toggle"

const FILTERS: readonly FlushToolbarFilter<SampleClient>[] = [
  {
    id: "status",
    allLabel: "All statuses",
    options: CLIENT_STATUS_OPTIONS,
    test: (row, value) => row.status === value,
  },
]

const searchClients = (row: SampleClient, query: string) =>
  row.name.toLowerCase().includes(query) ||
  row.industry.toLowerCase().includes(query)

export function FlushToolbarDemo() {
  const [state, setState] = useDemoState()
  return (
    <div>
      <DemoStateToggle value={state} onChange={setState} />
      <TableFlushToolbar
        data={rowsFor(state, SAMPLE_CLIENTS)}
        columns={CLIENT_COLUMNS}
        getRowId={(row) => row.id}
        searchFilter={searchClients}
        searchPlaceholder="Search clients"
        filters={FILTERS}
        loading={state === "loading"}
        actions={
          <Button size="sm">
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Add client
          </Button>
        }
      />
    </div>
  )
}
