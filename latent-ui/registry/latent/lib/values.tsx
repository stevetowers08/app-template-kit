import type * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Value display helpers shared by every variant.
 *
 * The rule (Wiki/Frontend/Patterns/Charts & Time Series, "measured zero vs not
 * measured"): `null` means the value is unknown. It renders as <Unmeasured />,
 * never as 0 and never as a fallback value. Every formatter takes `number | null`
 * and returns null for null so a caller cannot accidentally print "0".
 */

export type ValueUnit = "currency" | "count" | "percent" | "duration-ms"

const LOCALE = "en-AU"

export type FormatOptions = {
  currency?: string
  compact?: boolean
  /**
   * Fixed decimal places. By default currency shows cents only when the value has
   * them, so $0.41 never rounds to "$0" and $2,400 stays "$2,400".
   */
  decimals?: number
}

export function formatValue(value: number | null, unit: ValueUnit, options: FormatOptions = {}): string | null {
  if (value === null || !Number.isFinite(value)) return null
  const { currency = "AUD", compact = false, decimals } = options
  switch (unit) {
    case "currency": {
      const digits = decimals ?? (compact ? 1 : Number.isInteger(value) ? 0 : 2)
      return new Intl.NumberFormat(LOCALE, {
        style: "currency",
        currency,
        notation: compact ? "compact" : "standard",
        minimumFractionDigits: compact ? 0 : digits,
        maximumFractionDigits: digits,
      }).format(value)
    }
    case "count":
      return new Intl.NumberFormat(LOCALE, {
        notation: compact ? "compact" : "standard",
        maximumFractionDigits: compact ? 1 : 0,
      }).format(value)
    case "percent":
      return new Intl.NumberFormat(LOCALE, {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(value)
    case "duration-ms":
      return formatDuration(value)
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)} s`
  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)
  return `${minutes}m ${rest}s`
}

export type Delta = {
  /**
   * "relative": fractional change, 0.12 = +12%.
   * "points": absolute change of a rate, 0.06 = +6 percentage points. Used for percent
   * units, where a relative change ("+7.9%" for 76% -> 82%) reads as the wrong number.
   */
  readonly kind: "relative" | "points"
  readonly ratio: number
  readonly direction: "up" | "down" | "flat"
}

function directionOf(change: number): Delta["direction"] {
  return change > 0.0005 ? "up" : change < -0.0005 ? "down" : "flat"
}

/**
 * Change between two periods. Null when either side is unknown. For relative change,
 * also null when the previous value is 0 (a percentage change from zero is undefined,
 * not infinite). Pass `unit` so percent measures get percentage points.
 */
export function computeDelta(current: number | null, previous: number | null, unit?: ValueUnit): Delta | null {
  if (current === null || previous === null) return null
  if (unit === "percent") {
    const points = current - previous
    return { kind: "points", ratio: points, direction: directionOf(points) }
  }
  if (previous === 0) return null
  const ratio = (current - previous) / Math.abs(previous)
  return { kind: "relative", ratio, direction: directionOf(ratio) }
}

export function formatDelta(delta: Delta): string {
  const sign = delta.direction === "up" ? "+" : delta.direction === "down" ? "-" : ""
  if (delta.kind === "points") {
    const points = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(Math.abs(delta.ratio) * 100)
    return `${sign}${points} pts`
  }
  return `${sign}${new Intl.NumberFormat(LOCALE, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(Math.abs(delta.ratio))}`
}

/** Renders an unknown value. Visually quiet, but announced as "No data". */
export function Unmeasured({
  className,
  label = "No data",
  ...props
}: React.ComponentProps<"span"> & { label?: string }) {
  return (
    <span
      data-slot="unmeasured"
      title={label}
      className={cn("text-muted-foreground", className)}
      {...props}
    >
      <span aria-hidden="true">–</span>
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** Formats a value, or renders <Unmeasured /> when it is null. */
export function DisplayValue({
  value,
  unit,
  currency,
  compact,
  decimals,
  className,
}: {
  value: number | null
  unit: ValueUnit
  className?: string
} & FormatOptions) {
  const text = formatValue(value, unit, { currency, compact, decimals })
  if (text === null) return <Unmeasured className={className} />
  return <span className={cn("tabular-nums", className)}>{text}</span>
}
