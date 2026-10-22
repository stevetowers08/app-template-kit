import { BanknoteIcon, BotIcon, CheckCheckIcon, SmileIcon, TimerIcon, UsersIcon } from "lucide-react"

import { StatCardIconChip } from "../stat-card-icon-chip"
import { StatCardMinimal } from "../stat-card-minimal"
import { DEMO_GRID, measureOf, sampleStat, type SampleStatId } from "./sample"

export function MinimalDemo() {
  const ids = ["revenue", "active-clients", "response-time", "nps"] as const satisfies readonly SampleStatId[]
  return (
    <div className={DEMO_GRID}>
      {ids.map((id) => (
        <StatCardMinimal key={id} {...measureOf(sampleStat(id))} />
      ))}
    </div>
  )
}

const CHIPS = [
  { id: "revenue", icon: BanknoteIcon, tone: "primary", description: "Invoiced revenue for the month, before refunds." },
  { id: "agent-cost", icon: BotIcon, tone: "warning", description: "Model usage billed across every agent. Higher is worse." },
  { id: "approval-rate", icon: CheckCheckIcon, tone: "success", description: "Share of agent drafts approved without edits." },
  { id: "nps", icon: SmileIcon, tone: "primary", description: "Net Promoter Score from the client survey." },
] as const

export function IconChipDemo() {
  return (
    <div className="flex flex-col gap-4">
      <div className={DEMO_GRID}>
        {CHIPS.map(({ id, icon, tone, description }) => (
          <StatCardIconChip
            key={id}
            {...measureOf(sampleStat(id))}
            icon={icon}
            tone={tone}
            description={description}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">The same tile while loading, and when its source cannot be read:</p>
      <div className={DEMO_GRID}>
        <StatCardIconChip {...measureOf(sampleStat("active-clients"))} icon={UsersIcon} loading />
        <StatCardIconChip {...measureOf(sampleStat("response-time"))} icon={TimerIcon} error />
      </div>
    </div>
  )
}
