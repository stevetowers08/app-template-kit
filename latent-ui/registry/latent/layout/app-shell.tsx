import type * as React from "react"

import { cn } from "@/lib/utils"

/**
 * AppShell - the ONE vertical scroll owner for the app.
 *
 * `position: sticky` sticks to the nearest scrolling ancestor, so an app with more
 * than one scroller gets sticky headers that silently stop sticking. Every page is a
 * child of <main data-scroll-owner>; no page adds its own `overflow-y-auto`.
 * A deliberate second scroller (split view, chat pane) is documented where it lives.
 * See Wiki/Frontend/Layout & IA/Page Layout Primitives & App Shell Architecture.
 */
export function AppShell({
  header,
  sidebar,
  children,
  className,
}: {
  /** Top bar. Stays fixed because it sits outside the scroll owner. */
  header?: React.ReactNode
  /** Left navigation. Scrolls independently only if it overflows (a documented second owner). */
  sidebar?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex h-dvh flex-col bg-background text-foreground", className)}>
      {header}
      <div className="flex min-h-0 flex-1">
        {sidebar ? (
          <aside className="hidden w-60 shrink-0 overflow-y-auto border-r md:block">{sidebar}</aside>
        ) : null}
        <main data-scroll-owner className="min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
