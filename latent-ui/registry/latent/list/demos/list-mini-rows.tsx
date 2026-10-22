"use client"

import { SAMPLE_NOW, SAMPLE_TASKS } from "@/lib/gallery/sample-data"
import { ListMiniRows, type ListMiniRow } from "@/registry/latent/list/list-mini-rows"

const rows: readonly ListMiniRow[] = SAMPLE_TASKS.map((task) => ({
  id: task.id,
  href: `#${task.id}`,
  title: task.title,
  due: task.due,
  priority: task.priority,
}))

export function ListMiniRowsDemo() {
  return <ListMiniRows rows={rows} now={SAMPLE_NOW} />
}
