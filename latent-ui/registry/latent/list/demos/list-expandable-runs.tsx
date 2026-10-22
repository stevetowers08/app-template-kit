"use client"

import { SAMPLE_NOW, SAMPLE_RUNS } from "@/lib/gallery/sample-data"
import { ListExpandableRuns, type ListExpandableRunRow } from "@/registry/latent/list/list-expandable-runs"

const rows: readonly ListExpandableRunRow[] = SAMPLE_RUNS.map((run) => ({
  id: run.id,
  agent: run.agent,
  task: run.task,
  client: run.client,
  status: run.status,
  startedAt: run.startedAt,
  durationMs: run.durationMs,
  cost: run.cost,
}))

export function ListExpandableRunsDemo() {
  return <ListExpandableRuns rows={rows} now={SAMPLE_NOW} />
}
