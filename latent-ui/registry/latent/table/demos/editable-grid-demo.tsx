"use client"

import * as React from "react"

import { SAMPLE_CLIENTS, type ClientStatus } from "@/lib/gallery/sample-data"
import {
  editableColumn,
  TableEditableGrid,
  type EditableGridColumn,
} from "@/registry/latent/table/table-editable-grid"

import { CLIENT_STATUS_OPTIONS } from "./demo-cells"

/** A flat, editable copy of the sample clients. MRR stays null where it is unknown. */
type EditableClient = {
  id: string
  name: string
  industry: string
  status: ClientStatus
  mrr: number | null
  agents: number
}

const INITIAL: EditableClient[] = SAMPLE_CLIENTS.map((client) => ({
  id: client.id,
  name: client.name,
  industry: client.industry,
  status: client.status,
  mrr: client.mrr,
  agents: client.agents,
}))

const COLUMNS: EditableGridColumn<EditableClient>[] = [
  editableColumn(
    "Client",
    { variant: "short-text" },
    { id: "name", accessorKey: "name", size: 200 }
  ),
  editableColumn(
    "Industry",
    { variant: "short-text" },
    { id: "industry", accessorKey: "industry", size: 160 }
  ),
  editableColumn(
    "Status",
    { variant: "select", options: CLIENT_STATUS_OPTIONS },
    { id: "status", accessorKey: "status", size: 150 }
  ),
  editableColumn(
    "MRR (AUD)",
    { variant: "number", min: 0, step: 50 },
    { id: "mrr", accessorKey: "mrr", size: 130 }
  ),
  editableColumn(
    "Agents",
    { variant: "number", min: 0, step: 1 },
    { id: "agents", accessorKey: "agents", size: 110 }
  ),
]

export function EditableGridDemo() {
  const [rows, setRows] = React.useState<EditableClient[]>(INITIAL)
  const nextId = React.useRef(0)
  const addRow = () => {
    nextId.current += 1
    // A new client has no agents yet (a real 0) and no billing yet (unknown: null).
    const blank: EditableClient = {
      id: `new-${nextId.current}`,
      name: "",
      industry: "",
      status: "onboarding",
      mrr: null,
      agents: 0,
    }
    setRows((current) => [...current, blank])
    return { rowIndex: rows.length, columnId: "name" }
  }
  return (
    <TableEditableGrid
      data={rows}
      onDataChange={setRows}
      columns={COLUMNS}
      getRowId={(row) => row.id}
      onRowAdd={addRow}
      height={320}
    />
  )
}
