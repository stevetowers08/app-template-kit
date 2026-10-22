import { SAMPLE_STATS, type SampleStat } from "@/lib/gallery/sample-data"

import type { StatMeasure } from "../stat-delta"

/**
 * Gallery-only glue between SAMPLE_STATS and the variants' props. Throws on an unknown id
 * so a renamed sample fails loudly instead of rendering a blank.
 */

export type SampleStatId =
  | "revenue"
  | "active-clients"
  | "agent-cost"
  | "approval-rate"
  | "response-time"
  | "nps"

export function sampleStat(id: SampleStatId): SampleStat {
  const stat = SAMPLE_STATS.find((candidate) => candidate.id === id)
  if (!stat) throw new Error(`stat-card demo: no sample stat "${id}"`)
  return stat
}

/** The shared props for one sample stat. */
export function measureOf(stat: SampleStat): StatMeasure {
  return {
    label: stat.label,
    value: stat.value,
    previous: stat.previous,
    unit: stat.unit,
    invert: stat.invert,
    footnote: stat.footnote,
    comparisonLabel: stat.comparison,
  }
}

/** The four stats most demos show: a target, an inverted cost, a gap series and a null. */
export const DEMO_IDS = ["revenue", "agent-cost", "approval-rate", "nps"] as const satisfies readonly SampleStatId[]

export const DEMO_GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
