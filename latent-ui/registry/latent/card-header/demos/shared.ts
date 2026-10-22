import type { BadgeProps } from "@/components/reui/badge"
import type { RunStatus } from "@/lib/gallery/sample-data"

/** One status -> badge look, shared across every card-header demo that lists runs. */
export const RUN_STATUS_BADGE: Record<RunStatus, { variant: BadgeProps["variant"]; label: string }> = {
  succeeded: { variant: "success-light", label: "Succeeded" },
  running: { variant: "info-light", label: "Running" },
  failed: { variant: "destructive-light", label: "Failed" },
  "awaiting-approval": { variant: "warning-light", label: "Needs approval" },
}
