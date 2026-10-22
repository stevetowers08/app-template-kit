"use client"

import type * as React from "react"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export type BulkAction<TData> = {
  readonly label: string
  readonly icon?: React.ReactNode
  readonly destructive?: boolean
  readonly onSelect: (rows: readonly TData[]) => void
}

/**
 * The floating pill that appears while rows are selected (the venue CRM
 * `BulkBar`, re-hosted inside the table frame instead of a global toast so it
 * belongs to the table it acts on). A toolbar with a live count; clearing is
 * always one click away.
 */
export function BulkActionBar<TData>({
  selected,
  actions,
  onClear,
}: {
  selected: readonly TData[]
  actions: readonly BulkAction<TData>[]
  onClear: () => void
}) {
  if (selected.length === 0) return null

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-popover py-1 ps-3 pe-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10"
    >
      <span
        aria-live="polite"
        className="text-xs font-medium whitespace-nowrap tabular-nums"
      >
        {selected.length} selected
      </span>
      <Separator orientation="vertical" className="mx-1 h-4" />
      {actions.map((action) => (
        <Button
          key={action.label}
          variant={action.destructive ? "destructive" : "ghost"}
          size="sm"
          className="rounded-full"
          onClick={() => action.onSelect(selected)}
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
      <Separator orientation="vertical" className="mx-1 h-4" />
      <Button
        variant="ghost"
        size="icon-sm"
        className="rounded-full"
        aria-label="Clear selection"
        onClick={onClear}
      >
        <XIcon aria-hidden="true" />
      </Button>
    </div>
  )
}
