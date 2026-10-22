"use client"

import { CopyIcon, ExternalLinkIcon, MoreHorizontalIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SAMPLE_RUNS, type SampleRun } from "@/lib/gallery/sample-data"
import type { LatentColumnDef } from "@/registry/latent/table/lib/latent-table-features"
import { TableStripeFlush } from "@/registry/latent/table/table-stripe-flush"

import { Cents, DateTimeCell, RunStatusBadge } from "./demo-cells"

/**
 * Ledger layout: amount first and emphasised. Every amount here is AUD, so the
 * currency is stated once in the header rather than repeated on each row (a
 * per-row code earns its place only when currencies are mixed).
 */
const COLUMNS: readonly LatentColumnDef<SampleRun>[] = [
  {
    id: "cost",
    accessorFn: (row) => row.cost ?? undefined,
    sortUndefined: "last",
    meta: { label: "Amount (AUD)", numeric: true, width: "8rem" },
    cell: ({ row }) => (
      <span className="font-medium">
        <Cents value={row.original.cost} />
      </span>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    meta: { label: "Status" },
    cell: ({ row }) => <RunStatusBadge status={row.original.status} />,
  },
  {
    id: "task",
    accessorKey: "task",
    meta: { label: "Description" },
    cell: ({ row }) => (
      <span>
        {row.original.task}
        <span className="text-muted-foreground"> · {row.original.agent}</span>
      </span>
    ),
  },
  { id: "client", accessorKey: "client", meta: { label: "Client" } },
  {
    id: "startedAt",
    accessorKey: "startedAt",
    meta: { label: "Date" },
    cell: ({ row }) => <DateTimeCell iso={row.original.startedAt} />,
  },
]

function RunActions({ run }: { run: SampleRun }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for run ${run.id}`}
          >
            <MoreHorizontalIcon aria-hidden="true" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => toast(`Would open ${run.id} (sample data)`)}
        >
          <ExternalLinkIcon aria-hidden="true" />
          View run
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => toast(`Would copy ${run.id} (sample data)`)}
        >
          <CopyIcon aria-hidden="true" />
          Copy run ID
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function StripeFlushDemo() {
  return (
    <TableStripeFlush
      data={SAMPLE_RUNS}
      columns={COLUMNS}
      getRowId={(row) => row.id}
      rowActions={(run) => <RunActions run={run} />}
      rowNoun={{ one: "run", other: "runs" }}
      initialSorting={[{ id: "startedAt", desc: true }]}
    />
  )
}
