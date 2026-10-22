"use client"

import { CheckCircle2Icon, TriangleAlertIcon, UserIcon, XCircleIcon } from "lucide-react"
import type { ReactNode } from "react"

import { SAMPLE_ACTIVITY, SAMPLE_NOW, type SampleActivity } from "@/lib/gallery/sample-data"
import { ListGroupedFeed, type ListGroupedFeedGroup } from "@/registry/latent/list/list-grouped-feed"

/** The date each ISO string names, read as digits - never a runtime-local field. */
function dateOnly(iso: string): string {
  return iso.slice(0, 10)
}

function dayLabel(iso: string, now: string): string {
  const diffDays = Math.round(
    (Date.parse(`${dateOnly(now)}T00:00:00Z`) - Date.parse(`${dateOnly(iso)}T00:00:00Z`)) / 86_400_000
  )
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return new Date(`${dateOnly(iso)}T00:00:00Z`).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
}

const ACTIVITY_ICON: Record<NonNullable<SampleActivity["tone"]>, ReactNode> = {
  default: <UserIcon />,
  success: <CheckCircle2Icon />,
  warning: <TriangleAlertIcon />,
  destructive: <XCircleIcon />,
}

function groupByDay(activity: readonly SampleActivity[], now: string): readonly ListGroupedFeedGroup[] {
  const byLabel = new Map<string, SampleActivity[]>()
  for (const entry of activity) {
    const label = dayLabel(entry.at, now)
    byLabel.set(label, [...(byLabel.get(label) ?? []), entry])
  }
  return [...byLabel.entries()].map(([label, entries]) => ({
    id: label,
    label,
    rows: entries.map((entry) => ({
      id: entry.id,
      icon: ACTIVITY_ICON[entry.tone ?? "default"],
      headline: `${entry.actor.name} ${entry.action}`,
      meta: entry.target,
      badge: entry.actor.kind === "agent" ? { label: "Agent", variant: "outline" as const } : undefined,
    })),
  }))
}

const groups = groupByDay(SAMPLE_ACTIVITY, SAMPLE_NOW)

export function ListGroupedFeedDemo() {
  return <ListGroupedFeed groups={groups} />
}
