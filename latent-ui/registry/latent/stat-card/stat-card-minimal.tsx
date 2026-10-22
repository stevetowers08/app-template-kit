import { Card, CardContent } from "@/components/ui/card"
import { DisplayValue } from "@/registry/latent/lib/values"

import type { StatMeasure } from "./stat-delta"

/**
 * Ported from system-front-end's StatCard (components/stat-card.tsx): caps label over one
 * big number, nothing else. internal app set the number in mono; this uses sans + tabular-nums per
 * the vault Typography Scale (mono is for code and IDs, not KPI figures).
 * No delta by design. A null value shows <Unmeasured /> and the footnote says why.
 */

export type StatCardMinimalProps = Pick<StatMeasure, "label" | "value" | "unit" | "footnote" | "currency"> & {
  className?: string
}

export function StatCardMinimal({ label, value, unit, footnote, currency, className }: StatCardMinimalProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
        <DisplayValue
          value={value}
          unit={unit}
          currency={currency}
          className="text-2xl leading-none font-semibold tabular-nums"
        />
        {value === null && footnote ? (
          <p className="text-xs text-muted-foreground">{footnote}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
