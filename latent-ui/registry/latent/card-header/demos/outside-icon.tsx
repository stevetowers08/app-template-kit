import { ZapIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { SAMPLE_RUNS } from "@/lib/gallery/sample-data"

import { CardHeaderOutsideIcon } from "../card-header-outside-icon"

export function CardHeaderOutsideIconDemo() {
  const runningNow = SAMPLE_RUNS.filter((run) => run.status === "running" || run.status === "awaiting-approval")

  return (
    <CardHeaderOutsideIcon
      icon={<ZapIcon />}
      title="Agents"
      count={runningNow.length}
      help="Agents currently running or waiting on a human approval."
      onNavigate={() => undefined}
    >
      <Card>
        <CardContent className="flex flex-col gap-2">
          {runningNow.map((run) => (
            <div key={run.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{run.agent}</span>
              <span className="text-muted-foreground">{run.task}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </CardHeaderOutsideIcon>
  )
}
