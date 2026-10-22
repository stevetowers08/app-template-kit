"use client"

import { EllipsisIcon } from "lucide-react"
import type * as React from "react"

import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { DisplayValue } from "@/registry/latent/lib/values"

import { DELTA_BADGE_VARIANT, DeltaIcon, resolveDelta, type StatMeasure } from "./stat-delta"

/**
 * Ported from ReUI c-card-15 ("Stat card with trend and overflow menu"): muted label with an
 * overflow menu, value with a tinted change badge, a hairline, then the previous period's
 * figure written out ("Vs Aug 2026: $43,100") so the change can be checked by eye.
 * An unmeasured previous figure prints as a dash there, never as $0.
 */

export type StatCardAction = {
  readonly label: string
  readonly onSelect: () => void
  readonly icon?: React.ComponentType<{ className?: string }>
  /** Listed last, after a separator, in the destructive colour. */
  readonly destructive?: boolean
}

export type StatCardTrendMenuProps = StatMeasure & {
  actions?: readonly StatCardAction[]
  className?: string
}

export function StatCardTrendMenu({ actions = [], className, ...measure }: StatCardTrendMenuProps) {
  const delta = resolveDelta(measure)

  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{measure.label}</p>
          {actions.length > 0 ? <ActionsMenu label={measure.label} actions={actions} /> : null}
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <DisplayValue
              value={measure.value}
              unit={measure.unit}
              currency={measure.currency}
              className="text-2xl font-medium tracking-tight tabular-nums"
            />
            {delta ? (
              <Badge variant={DELTA_BADGE_VARIANT[delta.tone]} className="tabular-nums">
                <DeltaIcon direction={delta.delta.direction} />
                <span aria-hidden="true">{delta.text}</span>
                <span className="sr-only">{delta.description}</span>
              </Badge>
            ) : null}
          </div>
          <Separator />
          <PreviousLine measure={measure} />
        </div>
      </CardContent>
    </Card>
  )
}

function PreviousLine({ measure }: { measure: StatMeasure }) {
  if (measure.value === null) {
    return measure.footnote ? <p className="text-xs text-muted-foreground">{measure.footnote}</p> : null
  }
  if (measure.previous === undefined || !measure.comparisonLabel) return null
  return (
    <p className="text-xs text-muted-foreground">
      Vs {measure.comparisonLabel}:{" "}
      <span className="font-medium text-foreground">
        <DisplayValue value={measure.previous} unit={measure.unit} currency={measure.currency} />
      </span>
    </p>
  )
}

function ActionsMenu({ label, actions }: { label: string; actions: readonly StatCardAction[] }) {
  const regular = actions.filter((action) => !action.destructive)
  const destructive = actions.filter((action) => action.destructive)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="-me-1.5" aria-label={`${label} options`} />}
      >
        <EllipsisIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          {regular.map((action) => (
            <ActionItem key={action.label} action={action} />
          ))}
        </DropdownMenuGroup>
        {destructive.length > 0 ? (
          <>
            {regular.length > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuGroup>
              {destructive.map((action) => (
                <ActionItem key={action.label} action={action} />
              ))}
            </DropdownMenuGroup>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ActionItem({ action }: { action: StatCardAction }) {
  const Icon = action.icon
  return (
    <DropdownMenuItem variant={action.destructive ? "destructive" : "default"} onClick={action.onSelect}>
      {Icon ? <Icon aria-hidden="true" /> : null}
      {action.label}
    </DropdownMenuItem>
  )
}
