import { Badge } from "@/components/ui/badge"
import { SAMPLE_CLIENTS } from "@/lib/gallery/sample-data"
import { DisplayValue } from "@/registry/latent/lib/values"

import { CardHeaderInlineDot } from "../card-header-inline-dot"

const CLIENT_TONE = {
  active: "success",
  onboarding: "info",
  paused: "warning",
  churned: "destructive",
} as const

export function CardHeaderInlineDotDemo() {
  const client = SAMPLE_CLIENTS.find((c) => c.id === "c6")!

  return (
    <CardHeaderInlineDot
      title={client.name}
      tone={CLIENT_TONE[client.status]}
      badge={<Badge variant="outline">{client.industry}</Badge>}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">MRR</span>
        <span className="tabular-nums">
          <DisplayValue value={client.mrr} unit="currency" />
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Active agents</span>
        <span className="tabular-nums">
          <DisplayValue value={client.agents} unit="count" />
        </span>
      </div>
    </CardHeaderInlineDot>
  )
}
