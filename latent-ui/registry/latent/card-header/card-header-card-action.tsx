import type * as React from "react"

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * CardHeaderCardAction - the shadcn base-nova baseline: CardHeader's own grid
 * puts title + description on the left column and `CardAction` in the right
 * column, spanning both rows. No custom classes - this is stock composition.
 *
 * Source: shadcn base-nova `components/ui/card.tsx` default CardHeader grid;
 * matches tours analytics app `section-card` SectionCard
 * (stock CardHeader: CardTitle + CardDescription, actions top-right).
 */
export type CardHeaderCardActionProps = {
  title: string
  description?: React.ReactNode
  /** Right-hand slot, e.g. a Button or a ButtonGroup. */
  actions?: React.ReactNode
  /** Card body. */
  children?: React.ReactNode
  className?: string
}

export function CardHeaderCardAction({
  title,
  description,
  actions,
  children,
  className,
}: CardHeaderCardActionProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {actions ? <CardAction>{actions}</CardAction> : null}
      </CardHeader>
      {children ? <CardContent>{children}</CardContent> : null}
    </Card>
  )
}
