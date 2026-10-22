"use client"

import { SAMPLE_ACTIVITY, SAMPLE_NOW } from "@/lib/gallery/sample-data"
import { ListTimelineFeed, type ListTimelineRow } from "@/registry/latent/list/list-timeline-feed"

const rows: readonly ListTimelineRow[] = SAMPLE_ACTIVITY.map((activity) => ({
  id: activity.id,
  title: `${activity.actor.name} ${activity.action}`,
  description: activity.target,
  at: activity.at,
  tone: activity.tone,
}))

export function ListTimelineFeedDemo() {
  return <ListTimelineFeed rows={rows} now={SAMPLE_NOW} />
}
