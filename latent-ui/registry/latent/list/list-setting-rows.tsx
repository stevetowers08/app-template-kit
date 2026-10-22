import type * as React from "react"
import { Fragment } from "react"

import { Card, CardContent } from "@/components/ui/card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"

export type ListSettingRow = {
  readonly id: string
  readonly control: React.ReactNode
  readonly label: string
  readonly description?: string
  readonly action?: React.ReactNode
}

/**
 * Control-first setting rows in one Card, hairline-divided: the switch or
 * checkbox comes BEFORE the label, not after.
 *
 * Source: the tours analytics app `setting-row`
 * (`SettingsGroup` + `SettingRow`).
 */
export function ListSettingRows({ rows }: { rows: readonly ListSettingRow[] }) {
  return (
    <Card>
      <CardContent>
        <ItemGroup className="gap-0">
          {rows.map((row, index) => (
            <Fragment key={row.id}>
              {index > 0 ? <ItemSeparator /> : null}
              <Item variant="default" className="px-0">
                <ItemMedia>{row.control}</ItemMedia>
                <ItemContent>
                  <ItemTitle>{row.label}</ItemTitle>
                  {row.description ? <ItemDescription>{row.description}</ItemDescription> : null}
                </ItemContent>
                {row.action ? <ItemActions>{row.action}</ItemActions> : null}
              </Item>
            </Fragment>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}
