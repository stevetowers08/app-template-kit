"use client"

import { BanknoteIcon, BellIcon, BotIcon, CheckCheckIcon, PinIcon, SmileIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { StatCardDice } from "../stat-card-dice"
import { StatCardTrendMenu, type StatCardAction } from "../stat-card-trend-menu"
import { DEMO_GRID, DEMO_IDS, measureOf, sampleStat } from "./sample"

const ICONS = {
  revenue: BanknoteIcon,
  "agent-cost": BotIcon,
  "approval-rate": CheckCheckIcon,
  nps: SmileIcon,
} as const

export function DiceDemo() {
  return (
    <div className={DEMO_GRID}>
      {DEMO_IDS.map((id) => {
        const stat = sampleStat(id)
        return (
          <StatCardDice
            key={id}
            {...measureOf(stat)}
            icon={ICONS[id]}
            description={stat.footnote ?? stat.period}
          />
        )
      })}
    </div>
  )
}

function actionsFor(label: string): StatCardAction[] {
  return [
    { label: "Pin to dashboard", icon: PinIcon, onSelect: () => toast(`Pinned ${label} (demo)`) },
    { label: "Add alert", icon: BellIcon, onSelect: () => toast(`Alert added for ${label} (demo)`) },
    { label: "Remove", icon: Trash2Icon, destructive: true, onSelect: () => toast(`Removed ${label} (demo)`) },
  ]
}

export function TrendMenuDemo() {
  return (
    <div className={DEMO_GRID}>
      {DEMO_IDS.map((id) => {
        const stat = sampleStat(id)
        return <StatCardTrendMenu key={id} {...measureOf(stat)} actions={actionsFor(stat.label)} />
      })}
    </div>
  )
}
