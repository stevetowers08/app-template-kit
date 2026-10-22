import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { DisplayValue } from "@/registry/latent/lib/values"

import { DeltaText, resolveDelta, type StatMeasure } from "./stat-delta"

/**
 * Ported from the tours analytics app's dashboard design option C (apps/bookings/app/(dashboard)/
 * settings/design/dashboard-options.tsx): ONE bar with a caps title, then value + label
 * pairs split by vertical separators. Several figures for the height of one line.
 *
 * the tours analytics app printed a count of 0 as a dash, so a real zero read as missing. Here a dash only
 * ever means not measured, and the footnotes of unmeasured items are listed under the bar
 * (the the ops dashboard StatsBar "one footnote under the row" pattern).
 */

export type SummaryStripItem = StatMeasure & {
  /** Stable key for the item. */
  readonly id: string
}

export type StatCardSummaryStripProps = {
  title?: string
  items: readonly SummaryStripItem[]
  className?: string
}

export function StatCardSummaryStrip({ title = "Overview", items, className }: StatCardSummaryStripProps) {
  const notes = items.filter((item) => item.value === null && item.footnote)

  return (
    <Card size="sm" className={cn("gap-2", className)}>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start gap-x-6">
          <p className="shrink-0 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
          <ul className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-x-6">
                <Separator orientation="vertical" className="hidden h-4 self-center md:block" />
                <StripItem item={item} />
              </li>
            ))}
          </ul>
        </div>
        {notes.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {notes.map((item) => `${item.label}: ${item.footnote}.`).join(" ")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function StripItem({ item }: { item: SummaryStripItem }) {
  const delta = resolveDelta(item)
  return (
    <span className="flex flex-wrap items-baseline gap-x-1.5">
      <DisplayValue
        value={item.value}
        unit={item.unit}
        currency={item.currency}
        className="text-lg font-semibold tabular-nums"
      />
      <span className="text-xs text-muted-foreground">{item.label}</span>
      {delta ? <DeltaText delta={delta} className="ml-1" /> : null}
    </span>
  )
}
