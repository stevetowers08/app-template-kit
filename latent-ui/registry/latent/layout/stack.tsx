import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Stack / Inline - spacing and direction as props, so pages do not improvise
 * `flex gap-*` per element. Gap steps follow the 4px base unit
 * (Wiki/Frontend/Foundations/Spacing & Density System).
 */
const gap = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
  12: "gap-12",
} as const

const stackVariants = cva("flex flex-col", {
  variants: { gap },
  defaultVariants: { gap: 4 },
})

export function Stack({
  gap,
  className,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof stackVariants>) {
  return <div className={cn(stackVariants({ gap }), className)} {...props} />
}

const inlineVariants = cva("flex flex-row", {
  variants: {
    gap,
    align: { start: "items-start", center: "items-center", end: "items-end", baseline: "items-baseline" },
    justify: { start: "justify-start", between: "justify-between", end: "justify-end" },
    wrap: { true: "flex-wrap", false: "flex-nowrap" },
  },
  defaultVariants: { gap: 2, align: "center", justify: "start", wrap: true },
})

export function Inline({
  gap,
  align,
  justify,
  wrap,
  className,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inlineVariants>) {
  return <div className={cn(inlineVariants({ gap, align, justify, wrap }), className)} {...props} />
}
