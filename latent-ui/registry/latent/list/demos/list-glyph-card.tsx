"use client"

import { AlertTriangleIcon, CircleDotIcon, CircleIcon } from "lucide-react"
import type { ReactNode } from "react"

import { SAMPLE_TASKS, type SampleTask } from "@/lib/gallery/sample-data"
import { ListGlyphCard, type ListGlyphCardRow } from "@/registry/latent/list/list-glyph-card"

const PRIORITY: Record<SampleTask["priority"], { icon: ReactNode; tone: ListGlyphCardRow["tone"]; label: string }> = {
  high: { icon: <AlertTriangleIcon />, tone: "warning", label: "High priority" },
  medium: { icon: <CircleDotIcon />, tone: "primary", label: "Medium priority" },
  low: { icon: <CircleIcon />, tone: undefined, label: "Low priority" },
}

const rows: readonly ListGlyphCardRow[] = SAMPLE_TASKS.map((task) => {
  const priority = PRIORITY[task.priority]
  return {
    id: task.id,
    icon: priority.icon,
    tone: priority.tone,
    title: task.title,
    badge: priority.label,
    description: task.assignee ? `${task.client} · Assigned to ${task.assignee.name}` : `${task.client} · Unassigned`,
    selected: task.done,
  }
})

export function ListGlyphCardDemo() {
  return <ListGlyphCard rows={rows} />
}
