import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SAMPLE_TASKS } from "@/lib/gallery/sample-data"

import { CardHeaderCardAction } from "../card-header-card-action"

export function CardHeaderCardActionDemo() {
  const openTasks = SAMPLE_TASKS.filter((task) => !task.done).slice(0, 3)

  return (
    <CardHeaderCardAction
      title="Tasks"
      description={`${openTasks.length} open across every client`}
      actions={<Button size="sm">New task</Button>}
    >
      <ul className="flex flex-col gap-2">
        {openTasks.map((task) => (
          <li key={task.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{task.title}</span>
            <Badge variant={task.priority === "high" ? "destructive" : "outline"}>{task.priority}</Badge>
          </li>
        ))}
      </ul>
    </CardHeaderCardAction>
  )
}
