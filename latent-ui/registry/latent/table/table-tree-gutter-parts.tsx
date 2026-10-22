"use client"

import { MinusIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * The expand gutter, ported from the tours analytics app `expand-gutter`: a
 * square 32px leading column carrying the `+`/`-` toggle and a connector line
 * that brackets the expanded group. ONE LEVEL ONLY, so this stays a plain table
 * with `aria-expanded` on the toggle BUTTON; two or more levels would need
 * `role="treegrid"` and full 2D keyboard navigation (vault Data Tables & Grids).
 */
export const GUTTER_CELL = "relative w-8 px-1.5"

/**
 * Three segments make the line read as a bracket: from the parent's toggle down,
 * through each middle child edge to edge, and into the LAST child only as far as
 * its midpoint, so the group visibly closes. Joining edges overshoot by 1px to
 * cover the sub-pixel gap at every row border. The axis is a fixed 16px (6px
 * padding + half the 20px toggle), not `left-1/2`, so parent and child segments
 * land on the same x whatever width the browser computes.
 */
const SPAN = {
  "from-toggle": "top-1/2 -bottom-px",
  through: "-inset-y-px",
  "to-last": "-top-px bottom-1/2",
} as const

export function ConnectorLine({ span }: { span: keyof typeof SPAN }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute left-4 w-px -translate-x-1/2 bg-muted-foreground/40",
        SPAN[span]
      )}
    />
  )
}

export function ExpandToggle({
  expanded,
  onToggle,
  controls,
  label,
  childNoun,
}: {
  expanded: boolean
  onToggle: () => void
  /**
   * Space-separated DOM ids of the child rows, derived from entity ids, never
   * indexes. Pass it only while expanded: collapsed children are not rendered,
   * and an id reference to a missing element is invalid ARIA.
   */
  controls: string | undefined
  label: string
  childNoun: string
}) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-expanded={expanded}
      aria-controls={controls}
      aria-label={`${expanded ? "Hide" : "Show"} ${childNoun} for ${label}`}
      onClick={onToggle}
      className="relative z-10 size-5 text-muted-foreground hover:bg-transparent hover:text-foreground"
    >
      {expanded ? (
        <MinusIcon aria-hidden="true" />
      ) : (
        <PlusIcon aria-hidden="true" />
      )}
    </Button>
  )
}

/**
 * Split hover (the tours analytics app `TABLE_ROW_HOVER_SPLIT`): the gutter and the rest of the
 * row are two targets, so they light up separately and never both at once.
 */
export const SPLIT_HOVER = cn(
  "hover:bg-transparent",
  "[&:hover:not(:has([data-expand-gutter]:hover))>td:not([data-expand-gutter])]:bg-accent/50",
  "[&>td[data-expand-gutter]:hover]:bg-accent"
)

/** Children sit on a tinted band so an expanded group reads as one block. */
export const CHILD_ROW_TINT = "bg-muted/40"
