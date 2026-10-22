"use client"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

/**
 * Single-line text that discloses its full value on demand (Pulse `TableText`).
 *
 * The trigger is the popover's own button, never a `title=""` or a tooltip on a
 * plain span: those only open on mouse hover, so keyboard and touch have no path
 * to the hidden text. A popover opens on click, Enter/Space and tap. The dotted
 * underline on hover and focus says there is more behind the ellipsis.
 */
export function LatentTruncatedText({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "block w-full cursor-pointer truncate text-left decoration-dotted underline-offset-2 outline-none hover:underline focus-visible:underline",
          className
        )}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 text-sm leading-relaxed whitespace-pre-wrap"
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}
