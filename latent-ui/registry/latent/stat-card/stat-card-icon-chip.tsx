"use client"

import type * as React from "react"

import { IconTile } from "@/components/reui/icon-tile"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { DisplayValue, Unmeasured } from "@/registry/latent/lib/values"

import { DeltaText, resolveDelta, type StatMeasure } from "./stat-delta"

/**
 * Ported from the venue CRM's StatTile (StatTile) with the states of its
 * ReportKpiCard: small label over a bold figure, tinted icon chip top-right.
 * It owns the four states a figure can be in, so no page re-decides them: loading
 * (skeleton), unreadable (`error`: a dash and "Unavailable"), not measured (null) and known.
 *
 * Two deliberate changes: the figure stays neutral and only the chip carries the tone (the
 * vault's rare-signal rule), and the explanation tooltip hangs off the chip, which is a
 * focusable button, instead of the whole tile, so keyboard users can reach it.
 */

type ChipTone = "primary" | "success" | "warning" | "destructive"

const CHIP_TONE: Record<ChipTone, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
}

export type StatCardIconChipProps = StatMeasure & {
  icon: React.ComponentType<{ className?: string }>
  tone?: ChipTone
  /** What the figure counts. Shown in a tooltip on the icon chip. */
  description?: string
  loading?: boolean
  /** The source could not be read. Never shown as 0. */
  error?: boolean
  className?: string
}

export function StatCardIconChip({
  icon,
  tone = "primary",
  description,
  loading = false,
  error = false,
  className,
  ...measure
}: StatCardIconChipProps) {
  const delta = loading || error ? null : resolveDelta(measure)
  const quiet = loading || error || measure.value === null

  return (
    <Card aria-busy={loading || undefined} className={cn("py-4", className)}>
      <CardContent className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-xs font-medium text-muted-foreground">{measure.label}</p>
          {loading ? (
            <>
              <Skeleton className="mt-0.5 h-7 w-20" />
              <span className="sr-only">Loading</span>
            </>
          ) : (
            <p className="text-xl font-bold tracking-tight tabular-nums">
              {error ? (
                <Unmeasured label="Unavailable" />
              ) : (
                <DisplayValue value={measure.value} unit={measure.unit} currency={measure.currency} />
              )}
            </p>
          )}
          {error ? (
            <span aria-hidden="true" className="text-xs text-muted-foreground">
              Unavailable
            </span>
          ) : null}
          {delta ? <DeltaText delta={delta} /> : null}
          {!loading && !error && measure.footnote ? (
            <span className="text-xs text-muted-foreground">{measure.footnote}</span>
          ) : null}
        </div>
        <Chip icon={icon} toneClass={quiet ? "text-muted-foreground" : CHIP_TONE[tone]} description={description} label={measure.label} />
      </CardContent>
    </Card>
  )
}

function Chip({
  icon: Icon,
  toneClass,
  description,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  toneClass: string
  description?: string
  label: string
}) {
  const tile = (
    <IconTile variant="soft" size="sm" className={toneClass}>
      <Icon aria-hidden="true" />
    </IconTile>
  )
  if (!description) return tile
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={`About ${label}`}
        className="shrink-0 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {tile}
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-64 leading-relaxed">
        {description}
      </TooltipContent>
    </Tooltip>
  )
}
