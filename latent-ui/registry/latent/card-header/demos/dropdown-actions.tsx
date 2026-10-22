import { Badge } from "@/components/reui/badge"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { SAMPLE_RUNS } from "@/lib/gallery/sample-data"
import { DisplayValue } from "@/registry/latent/lib/values"

import { CardHeaderDropdownActions } from "../card-header-dropdown-actions"

export function CardHeaderDropdownActionsDemo() {
  const run = SAMPLE_RUNS.find((r) => r.id === "r-1039")!

  return (
    <CardHeaderDropdownActions
      status={<Badge variant="info-light">Running</Badge>}
      menuLabel={`More options for ${run.agent}`}
      menuItems={
        <>
          <DropdownMenuItem>View trace</DropdownMenuItem>
          <DropdownMenuItem>Pause agent</DropdownMenuItem>
        </>
      }
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{run.agent}</p>
        <p className="text-sm text-muted-foreground">{run.task}</p>
        <p className="text-xs text-muted-foreground">
          Started, cost so far: <DisplayValue value={run.cost} unit="currency" />
        </p>
      </div>
    </CardHeaderDropdownActions>
  )
}
