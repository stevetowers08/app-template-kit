import type * as React from "react"

import { cn } from "@/lib/utils"

/**
 * PageHeader - one structure for every page: optional eyebrow, title, description
 * and an actions slot that wraps under the title on narrow screens.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  /** Breadcrumb or section label above the title. */
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <header
      data-slot="page-header"
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}
    >
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow ? <div className="text-sm text-muted-foreground">{eyebrow}</div> : null}
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        {description ? (
          <p className="max-w-prose text-sm text-pretty text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
