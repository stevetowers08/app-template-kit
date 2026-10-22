"use client"

import { Switch } from "@/components/ui/switch"
import { SAMPLE_RUNS } from "@/lib/gallery/sample-data"
import { ListSettingRows, type ListSettingRow } from "@/registry/latent/list/list-setting-rows"

// Derived from the sample runs (never invented): an agent that has ever produced
// an awaiting-approval run currently holds drafts for review; the rest run free.
const agentsNeedingApproval = new Set(
  SAMPLE_RUNS.filter((run) => run.status === "awaiting-approval").map((run) => run.agent)
)
const uniqueAgents = [...new Set(SAMPLE_RUNS.map((run) => run.agent))]

const rows: readonly ListSettingRow[] = uniqueAgents.map((agent) => ({
  id: agent,
  control: (
    <Switch defaultChecked={!agentsNeedingApproval.has(agent)} aria-label={`Let ${agent} run without approval`} />
  ),
  label: agent,
  description: agentsNeedingApproval.has(agent)
    ? "Currently holds drafts for your approval before sending."
    : "Runs automatically; nothing is held for review.",
}))

export function ListSettingRowsDemo() {
  return <ListSettingRows rows={rows} />
}
