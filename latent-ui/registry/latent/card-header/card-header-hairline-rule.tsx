import type * as React from "react"
import { InfoIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * CardHeaderHairlineRule - title (optionally with an (i) tooltip) plus a
 * description, actions top-right, then a hairline rule separating the header
 * from the body. Renders a whole Card.
 *
 * Source: venue CRM `ChartCard`
 * `ChartCard({title,description?,info?,actions?})`.
 */
export type CardHeaderHairlineRuleProps = {
  title: string
  description?: React.ReactNode
  /** Tooltip content behind an (i) button beside the title. */
  info?: React.ReactNode
  actions?: React.ReactNode
  /** Card body, below the rule. */
  children?: React.ReactNode
  className?: string
}

export function CardHeaderHairlineRule({
  title,
  description,
  info,
  actions,
  children,
  className,
}: CardHeaderHairlineRuleProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {info ? (
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="ghost" size="icon-xs" aria-label={`About ${title}`} />}
              >
                <InfoIcon aria-hidden="true" className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent>{info}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {actions ? <CardAction>{actions}</CardAction> : null}
      </CardHeader>
      <Separator className="opacity-40" />
      {children ? <CardContent>{children}</CardContent> : null}
    </Card>
  )
}
