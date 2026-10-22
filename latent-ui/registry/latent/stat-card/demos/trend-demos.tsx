import { SAMPLE_CLIENTS } from "@/lib/gallery/sample-data"
import { formatValue } from "@/registry/latent/lib/values"

import { StatCardGradientBadge } from "../stat-card-gradient-badge"
import { StatCardInlineGauge } from "../stat-card-inline-gauge"
import { StatCardSummaryStrip } from "../stat-card-summary-strip"
import { DEMO_GRID, measureOf, sampleStat, type SampleStatId } from "./sample"

export function SummaryStripDemo() {
  const ids = ["revenue", "active-clients", "agent-cost", "response-time", "nps"] as const satisfies readonly SampleStatId[]
  return <StatCardSummaryStrip items={ids.map((id) => ({ id, ...measureOf(sampleStat(id)) }))} />
}

export function GradientBadgeDemo() {
  const revenue = sampleStat("revenue")
  const spend = sampleStat("agent-cost")
  const nps = sampleStat("nps")
  // A share from the client list: clients whose billing is set up (mrr known, 0 included).
  const billed = SAMPLE_CLIENTS.filter((client) => client.mrr !== null).length

  return (
    <div className={DEMO_GRID}>
      <StatCardGradientBadge
        {...measureOf(revenue)}
        footer={`Target ${formatValue(revenue.target ?? null, revenue.unit)} · ${revenue.period}`}
      />
      <StatCardGradientBadge {...measureOf(spend)} footer={spend.footnote} />
      <StatCardGradientBadge
        label="Clients with billing set up"
        share={{ part: billed, whole: SAMPLE_CLIENTS.length }}
        footer="Counted over every client"
      />
      <StatCardGradientBadge {...measureOf(nps)} footer={nps.footnote} />
    </div>
  )
}

export function InlineGaugeDemo() {
  const revenue = sampleStat("revenue")
  const spend = sampleStat("agent-cost")
  const approval = sampleStat("approval-rate")
  const nps = sampleStat("nps")

  return (
    <div className={DEMO_GRID}>
      <StatCardInlineGauge {...measureOf(revenue)} visual="gauge" target={revenue.target ?? null} />
      <StatCardInlineGauge {...measureOf(spend)} series={spend.series} />
      <StatCardInlineGauge {...measureOf(approval)} series={approval.series} />
      <StatCardInlineGauge {...measureOf(nps)} series={nps.series} />
    </div>
  )
}
