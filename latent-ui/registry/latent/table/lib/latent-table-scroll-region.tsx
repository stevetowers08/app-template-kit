import type * as React from "react"

import { cn } from "@/lib/utils"

/**
 * The table's OWN bounded scroll box - a deliberate, documented SECOND scroll
 * owner. The page's one scroll owner stays AppShell's <main>; this region only
 * exists so a sticky <thead> has a real scroller to stick to.
 *
 * Why it must be bounded: `position: sticky` resolves against the NEAREST
 * scrolling ancestor, and any `overflow` other than visible/clip makes one. An
 * unbounded overflow box never scrolls itself, so the page scrolls instead and
 * the header silently stops sticking (the tours analytics app `/outliers` shipped exactly that).
 * A max-height makes this box the scroller that actually moves.
 * Vault: Components & Styling, "Sticky Table Headers & Scroll Containers" (Pattern B).
 *
 * Keyboard: a scrollable region must be reachable, so it takes focus and a name.
 * Render the `<table>` directly inside it; the shadcn `Table` wrapper adds its
 * own overflow box, which would become the sticky ancestor instead.
 */
export function LatentTableScrollRegion({
  label,
  className = "max-h-96",
  children,
}: {
  /** Accessible name for the region, e.g. "Clients table". */
  label: string
  /** Must include a max-height (default max-h-96), or the header will not stick. */
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      data-scroll-owner="table"
      className={cn(
        "relative w-full overflow-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
        className
      )}
    >
      {children}
    </div>
  )
}
