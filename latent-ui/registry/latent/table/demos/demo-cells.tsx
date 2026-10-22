import { Badge, type BadgeProps } from "@/components/reui/badge"
import type { ClientStatus, RunStatus } from "@/lib/gallery/sample-data"
import { Unmeasured } from "@/registry/latent/lib/values"

/**
 * Gallery-only cell renderers shared by the table demos. Column definitions live
 * in the demos, not in the variants, so these never ship with a registry item.
 */

const CLIENT_STATUS: Record<
  ClientStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  active: { label: "Active", variant: "success-light" },
  onboarding: { label: "Onboarding", variant: "info-light" },
  paused: { label: "Paused", variant: "warning-light" },
  churned: { label: "Churned", variant: "secondary" },
}

const RUN_STATUS: Record<
  RunStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  succeeded: { label: "Succeeded", variant: "success-light" },
  running: { label: "Running", variant: "info-light" },
  failed: { label: "Failed", variant: "destructive-light" },
  "awaiting-approval": { label: "Needs approval", variant: "warning-light" },
}

export const CLIENT_STATUS_OPTIONS = Object.entries(CLIENT_STATUS).map(
  ([value, { label }]) => ({ value, label })
)
export const RUN_STATUS_OPTIONS = Object.entries(RUN_STATUS).map(
  ([value, { label }]) => ({ value, label })
)

/** Status is always a word in a badge, never colour alone (WCAG 1.4.1). */
export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const { label, variant } = CLIENT_STATUS[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function RunStatusBadge({ status }: { status: RunStatus }) {
  const { label, variant } = RUN_STATUS[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function runStatusLabel(status: RunStatus): string {
  return RUN_STATUS[status].label
}

/**
 * Run costs are cents-scale (A$0.41). `formatValue(…, "currency")` rounds to whole
 * dollars, which would print a measured $0.41 as "$0" - a wrong number wearing the
 * right label. So costs use a fixed two-decimal format here; null stays Unmeasured.
 */
const CENTS = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCents(value: number | null): string | null {
  return value === null || !Number.isFinite(value) ? null : CENTS.format(value)
}

export function Cents({ value }: { value: number | null }) {
  const text = formatCents(value)
  if (text === null) return <Unmeasured />
  return <span className="tabular-nums">{text}</span>
}

/** Fixed time zone so the server and client render the same string. */
const DATE_TIME = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Australia/Sydney",
})

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso))
}

export function DateTimeCell({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} className="text-muted-foreground tabular-nums">
      {formatDateTime(iso)}
    </time>
  )
}
