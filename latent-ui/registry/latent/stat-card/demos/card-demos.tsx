import { BanknoteIcon, BotIcon, CheckCheckIcon, SmileIcon } from "lucide-react"

import { formatValue } from "@/registry/latent/lib/values"

import { StatCardChangePill } from "../stat-card-change-pill"
import { StatCardDeltaSparkline } from "../stat-card-delta-sparkline"
import { DEMO_GRID, DEMO_IDS, measureOf, sampleStat } from "./sample"

const ICONS = {
  revenue: BanknoteIcon,
  "agent-cost": BotIcon,
  "approval-rate": CheckCheckIcon,
  nps: SmileIcon,
} as const

export function ChangePillDemo() {
  return (
    <div className={DEMO_GRID}>
      {DEMO_IDS.map((id) => {
        const stat = sampleStat(id)
        const target = stat.target ?? null
        const targetText = formatValue(target, stat.unit)
        return (
          <StatCardChangePill
            key={id}
            {...measureOf(stat)}
            icon={ICONS[id]}
            target={target}
            sub={targetText ? `Target ${targetText} · ${stat.period}` : (stat.footnote ?? stat.period)}
          />
        )
      })}
    </div>
  )
}

export function DeltaSparklineDemo() {
  return (
    <div className={DEMO_GRID}>
      {DEMO_IDS.map((id) => {
        const stat = sampleStat(id)
        return <StatCardDeltaSparkline key={id} {...measureOf(stat)} series={stat.series} />
      })}
    </div>
  )
}
