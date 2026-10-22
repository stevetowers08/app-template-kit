"use client"

import { RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SAMPLE_RUNS } from "@/lib/gallery/sample-data"
import { TableFixedRows } from "@/registry/latent/table/table-fixed-rows"

import { DemoStateToggle, rowsFor, useDemoState } from "./demo-state-toggle"
import { RUN_COLUMNS } from "./run-columns"

export function FixedRowsDemo() {
  const [state, setState] = useDemoState()
  return (
    <div>
      <DemoStateToggle value={state} onChange={setState} />
      <TableFixedRows
        data={rowsFor(state, SAMPLE_RUNS)}
        columns={RUN_COLUMNS}
        getRowId={(row) => row.id}
        title="Agent runs"
        initialSorting={[{ id: "startedAt", desc: true }]}
        loading={state === "loading"}
        actions={
          <Button variant="outline" size="sm">
            <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
            Refresh
          </Button>
        }
      />
    </div>
  )
}
