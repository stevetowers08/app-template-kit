"use client"

import * as React from "react"
import { Line, LineChart, YAxis } from "recharts"

import { Card, CardContent } from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"

import { StatCardLegendToggle } from "../stat-card-legend-toggle"
import { DEMO_GRID, measureOf, sampleStat, type SampleStatId } from "./sample"

// chart-1 is near-white in the neutral palette, so the series start at chart-2.
const TILES = [
  { id: "revenue", color: "var(--chart-2)", help: "Invoiced revenue for the month, before refunds." },
  { id: "agent-cost", color: "var(--chart-3)", help: "Model usage billed across every agent. Higher is worse." },
  { id: "approval-rate", color: "var(--chart-4)", help: "Share of agent drafts approved without edits." },
  { id: "nps", color: "var(--chart-5)", help: "Net Promoter Score from the client survey." },
] as const satisfies readonly { id: SampleStatId; color: string; help: string }[]

type TileId = (typeof TILES)[number]["id"]

export function LegendToggleDemo() {
  const [active, setActive] = React.useState<ReadonlySet<TileId>>(() => new Set(["revenue", "approval-rate"]))

  function handleToggle(id: TileId, pressed: boolean) {
    setActive((current) => {
      const next = new Set(current)
      if (pressed) next.add(id)
      else next.delete(id)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={DEMO_GRID}>
        {TILES.map(({ id, color, help }) => (
          <StatCardLegendToggle
            key={id}
            {...measureOf(sampleStat(id))}
            color={color}
            help={help}
            pressed={active.has(id)}
            onPressedChange={(pressed) => handleToggle(id, pressed)}
          />
        ))}
      </div>
      <LegendChart active={active} />
    </div>
  )
}

function LegendChart({ active }: { active: ReadonlySet<TileId> }) {
  const shown = TILES.filter((tile) => active.has(tile.id))
  const length = Math.max(...TILES.map((tile) => sampleStat(tile.id).series.length))
  // Out-of-range points are unknown (null), never 0.
  const data = Array.from({ length }, (_, index) =>
    Object.fromEntries([
      ["index", index],
      ...TILES.map((tile) => [tile.id, sampleStat(tile.id).series[index] ?? null]),
    ])
  )
  const config = Object.fromEntries(
    TILES.map((tile) => [tile.id, { label: sampleStat(tile.id).label, color: tile.color }])
  ) satisfies ChartConfig

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        <ChartContainer config={config} className="aspect-auto h-40 w-full">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            {shown.map((tile) => (
              <YAxis key={`axis-${tile.id}`} yAxisId={tile.id} hide domain={["dataMin", "dataMax"]} />
            ))}
            {shown.map((tile) => (
              <Line
                key={tile.id}
                yAxisId={tile.id}
                dataKey={tile.id}
                type="monotone"
                stroke={`var(--color-${tile.id})`}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
        <p className="text-xs text-muted-foreground">
          Last 7 periods, each line on its own scale. A break in a line is a period that was not measured.
        </p>
      </CardContent>
    </Card>
  )
}
