"use client"

import { ArchiveIcon, DownloadIcon, PauseIcon } from "lucide-react"
import { toast } from "sonner"

import { SAMPLE_CLIENTS, type SampleClient } from "@/lib/gallery/sample-data"
import {
  TableFramedBulkActions,
  type BulkAction,
} from "@/registry/latent/table/table-framed-bulk-actions"

import { CLIENT_COLUMNS } from "./client-columns"
import { DemoStateToggle, rowsFor, useDemoState } from "./demo-state-toggle"

/** Gallery actions only report what they would do; nothing is changed. */
const notify = (verb: string) => (rows: readonly SampleClient[]) =>
  toast(
    `Would ${verb} ${rows.length} ${rows.length === 1 ? "client" : "clients"} (sample data)`
  )

const BULK_ACTIONS: readonly BulkAction<SampleClient>[] = [
  {
    label: "Pause",
    icon: <PauseIcon aria-hidden="true" />,
    onSelect: notify("pause"),
  },
  {
    label: "Export",
    icon: <DownloadIcon aria-hidden="true" />,
    onSelect: notify("export"),
  },
  {
    label: "Archive",
    icon: <ArchiveIcon aria-hidden="true" />,
    destructive: true,
    onSelect: notify("archive"),
  },
]

const rowLabel = (row: SampleClient) => row.name

export function FramedBulkActionsDemo() {
  const [state, setState] = useDemoState()
  return (
    <div>
      <DemoStateToggle value={state} onChange={setState} />
      <TableFramedBulkActions
        data={rowsFor(state, SAMPLE_CLIENTS)}
        columns={CLIENT_COLUMNS}
        getRowId={(row) => row.id}
        getRowLabel={rowLabel}
        bulkActions={BULK_ACTIONS}
        label="Clients"
        maxHeightClassName="max-h-72"
        rowNoun={{ one: "client", other: "clients" }}
        loading={state === "loading"}
      />
    </div>
  )
}
