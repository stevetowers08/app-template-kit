"use client"

import { SAMPLE_NOW, SAMPLE_TASKS } from "@/lib/gallery/sample-data"
import { ListTaskRows, type ListTaskRow } from "@/registry/latent/list/list-task-rows"

const rows: readonly ListTaskRow[] = SAMPLE_TASKS.map((task) => ({
  id: task.id,
  title: task.title,
  client: task.client,
  due: task.due,
  assignee: task.assignee,
  done: task.done,
}))

export function ListTaskRowsDemo() {
  return <ListTaskRows rows={rows} now={SAMPLE_NOW} />
}
