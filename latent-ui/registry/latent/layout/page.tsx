import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const pageVariants = cva("mx-auto flex w-full flex-col gap-6 px-4 py-6 md:px-6 md:py-8", {
  variants: {
    width: {
      /** Settings, forms, reading: one readable column. */
      narrow: "max-w-3xl",
      /** Most dashboard pages. */
      default: "max-w-6xl",
      /** Dense tables and multi-column dashboards. */
      wide: "max-w-screen-2xl",
      /** Edge-to-edge surfaces such as a full-bleed data grid. */
      full: "max-w-none",
    },
  },
  defaultVariants: { width: "default" },
})

/**
 * Page - width, side gutter and the vertical rhythm between header and body.
 * Every page uses one, so gutters and max widths cannot drift between pages.
 */
export function Page({
  width,
  className,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof pageVariants>) {
  return <div data-slot="page" className={cn(pageVariants({ width }), className)} {...props} />
}
