import type * as React from "react"
import { AlertTriangleIcon, CheckCircle2Icon, InfoIcon, XCircleIcon } from "lucide-react"

import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineDot,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/ui/timeline"
import { cn } from "@/lib/utils"

import { formatAbsolute, formatElapsed } from "./lib/list-format"

export type ListTimelineRow = {
  readonly id: string
  readonly title: string
  readonly description?: string
  readonly at: string
  readonly tone?: "default" | "success" | "warning" | "destructive"
}

const TONE_ICON: Record<NonNullable<ListTimelineRow["tone"]>, React.ComponentType<{ className?: string }>> = {
  default: InfoIcon,
  success: CheckCircle2Icon,
  warning: AlertTriangleIcon,
  destructive: XCircleIcon,
}

const TONE_TEXT: Record<NonNullable<ListTimelineRow["tone"]>, string> = {
  default: "text-muted-foreground",
  success: "text-success",
  warning: "text-amber-600 dark:text-amber-400",
  destructive: "text-destructive",
}

/**
 * Vertical activity timeline: a dot per entry joined by a connector line,
 * most recent marked active. The tone is never colour-only - it is always
 * paired with an icon next to the entry's own text.
 *
 * Source: the venue CRM `ActivityFeed`.
 */
export function ListTimelineFeed({ rows, now }: { rows: readonly ListTimelineRow[]; now: string }) {
  return (
    <Timeline activeIndex={0}>
      {rows.map((row) => {
        const tone = row.tone ?? "default"
        const ToneIcon = TONE_ICON[tone]
        return (
          <TimelineItem key={row.id}>
            <TimelineDot />
            <TimelineConnector />
            <TimelineContent>
              <TimelineTitle className="flex items-center gap-1.5 text-sm font-medium">
                <ToneIcon className={cn("size-3.5", TONE_TEXT[tone])} />
                {row.title}
              </TimelineTitle>
              {row.description ? <TimelineDescription>{row.description}</TimelineDescription> : null}
              <TimelineTime title={formatAbsolute(row.at)}>{formatElapsed(row.at, now)}</TimelineTime>
            </TimelineContent>
          </TimelineItem>
        )
      })}
    </Timeline>
  )
}
