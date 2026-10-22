import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { SAMPLE_RUNS } from "@/lib/gallery/sample-data"
import { DisplayValue } from "@/registry/latent/lib/values"

import { CardHeaderCapsLabel } from "../card-header-caps-label"
import { RUN_STATUS_BADGE } from "./shared"

export function CardHeaderCapsLabelDemo() {
  const runs = SAMPLE_RUNS.slice(0, 3)
  return (
    <CardHeaderCapsLabel
      label="Recent runs"
      actions={<Button variant="ghost" size="sm">View all</Button>}
    >
      <ul className="flex flex-col gap-2">
        {runs.map((run) => {
          const status = RUN_STATUS_BADGE[run.status]
          return (
            <li key={run.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{run.agent}</span>
              <Badge variant={status.variant}>{status.label}</Badge>
              <span className="w-16 shrink-0 text-right text-muted-foreground">
                <DisplayValue value={run.durationMs} unit="duration-ms" />
              </span>
            </li>
          )
        })}
      </ul>
    </CardHeaderCapsLabel>
  )
}
