"use client"

import { useState } from "react"
import { ChevronDownIcon } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status"
import { cn } from "@/lib/utils"
import { DisplayValue } from "@/registry/latent/lib/values"

import { formatAbsolute, formatElapsed } from "./lib/list-format"

export type ListExpandableRunRow = {
  readonly id: string
  readonly agent: string
  readonly task: string
  readonly client: string
  readonly status: "succeeded" | "running" | "failed" | "awaiting-approval"
  readonly startedAt: string
  readonly durationMs: number | null
  readonly cost: number | null
}

const STATUS_VARIANT: Record<ListExpandableRunRow["status"], "default" | "success" | "error" | "warning" | "info"> = {
  succeeded: "success",
  running: "info",
  failed: "error",
  "awaiting-approval": "warning",
}

const STATUS_LABEL: Record<ListExpandableRunRow["status"], string> = {
  succeeded: "Succeeded",
  running: "Running",
  failed: "Failed",
  "awaiting-approval": "Needs approval",
}

/**
 * One row per agent run; click to expand into the full client, status,
 * duration and cost. Only one row is open at a time.
 *
 * Source: Pulse `src/components/bot/ActivityFeed.tsx`.
 */
export function ListExpandableRuns({ rows, now }: { rows: readonly ListExpandableRunRow[]; now: string }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <ItemGroup className="gap-1">
      {rows.map((row) => {
        const open = openId === row.id
        return (
          <Collapsible key={row.id} open={open} onOpenChange={(next) => setOpenId(next ? row.id : null)}>
            <Item render={<CollapsibleTrigger className="w-full text-left" />} className="rounded-md">
              <ItemMedia>
                <Status variant={STATUS_VARIANT[row.status]}>
                  <StatusIndicator />
                </Status>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{row.agent}</ItemTitle>
                <ItemDescription>{row.task}</ItemDescription>
              </ItemContent>
              <ItemActions className="text-right text-xs text-muted-foreground">
                <span className="font-mono tabular-nums" title={formatAbsolute(row.startedAt)}>
                  {formatElapsed(row.startedAt, now)}
                </span>
                <ChevronDownIcon className={cn("transition-transform", open && "rotate-180")} />
              </ItemActions>
            </Item>
            <CollapsibleContent className="px-3 pb-2">
              <dl className="grid grid-cols-2 gap-3 rounded-md bg-muted/40 p-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Client</dt>
                  <dd>{row.client}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Status</dt>
                  <dd>
                    <Status variant={STATUS_VARIANT[row.status]}>
                      <StatusIndicator />
                      <StatusLabel>{STATUS_LABEL[row.status]}</StatusLabel>
                    </Status>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Duration</dt>
                  <dd>
                    <DisplayValue value={row.durationMs} unit="duration-ms" />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Cost</dt>
                  <dd>
                    <DisplayValue value={row.cost} unit="currency" />
                  </dd>
                </div>
              </dl>
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </ItemGroup>
  )
}
