import type * as React from "react"
import { BotIcon, CheckIcon, RotateCcwIcon, XIcon } from "lucide-react"

import { IconTile } from "@/components/reui/icon-tile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { formatAbsolute, formatElapsed } from "./lib/list-format"

export type ListApprovalQueueRow = {
  readonly id: string
  readonly agent: string
  readonly icon?: React.ReactNode
  readonly task: string
  readonly client: string
  readonly startedAt: string
  /** Only these two statuses need a human in the loop; a queue never lists a run that already succeeded. */
  readonly status: "awaiting-approval" | "failed"
  readonly onApprove?: (id: string) => void
  readonly onReject?: (id: string) => void
  readonly onRetry?: (id: string) => void
  readonly onDismiss?: (id: string) => void
}

const STATUS_BADGE: Record<ListApprovalQueueRow["status"], { label: string; variant: "outline" | "destructive" }> = {
  "awaiting-approval": { label: "Needs approval", variant: "outline" },
  failed: { label: "Failed", variant: "destructive" },
}

/**
 * A human-in-the-loop queue: one card per run that needs a decision, with
 * Approve/Reject for a draft awaiting sign-off and Retry/Dismiss for one
 * that failed outright.
 *
 * Source: ReUI `agent-activity-1` (community registry block), re-expressed
 * on Card + Button rather than copied verbatim.
 */
export function ListApprovalQueue({ rows, now }: { rows: readonly ListApprovalQueueRow[]; now: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing waiting on you.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => {
        const badge = STATUS_BADGE[row.status]
        return (
          <Card key={row.id} size="sm">
            <CardContent className="flex items-start gap-3">
              <IconTile
                size="sm"
                variant={row.status === "failed" ? "soft" : "outline"}
                className={row.status === "failed" ? "text-destructive" : undefined}
              >
                {row.icon ?? <BotIcon />}
              </IconTile>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{row.agent}</span>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{row.task}</p>
                <p className="text-xs text-muted-foreground">
                  {row.client} ·{" "}
                  <span title={formatAbsolute(row.startedAt)}>{formatElapsed(row.startedAt, now)}</span>
                </p>
                <div className="mt-1 flex gap-2">
                  {row.status === "awaiting-approval" ? (
                    <>
                      <Button size="sm" onClick={() => row.onApprove?.(row.id)}>
                        <CheckIcon data-icon="inline-start" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => row.onReject?.(row.id)}>
                        <XIcon data-icon="inline-start" />
                        Reject
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => row.onRetry?.(row.id)}>
                        <RotateCcwIcon data-icon="inline-start" />
                        Retry
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => row.onDismiss?.(row.id)}>
                        Dismiss
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
