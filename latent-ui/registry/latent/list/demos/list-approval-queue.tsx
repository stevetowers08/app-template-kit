"use client"

import { SAMPLE_NOW, SAMPLE_RUNS, type SampleRun } from "@/lib/gallery/sample-data"
import { ListApprovalQueue, type ListApprovalQueueRow } from "@/registry/latent/list/list-approval-queue"

/** Only these two states need a human decision; a queue never lists a run that already succeeded. */
function needsHuman(run: SampleRun): run is SampleRun & { status: "awaiting-approval" | "failed" } {
  return run.status === "awaiting-approval" || run.status === "failed"
}

const rows: readonly ListApprovalQueueRow[] = SAMPLE_RUNS.filter(needsHuman).map((run) => ({
  id: run.id,
  agent: run.agent,
  task: run.task,
  client: run.client,
  startedAt: run.startedAt,
  status: run.status,
}))

export function ListApprovalQueueDemo() {
  return <ListApprovalQueue rows={rows} now={SAMPLE_NOW} />
}
