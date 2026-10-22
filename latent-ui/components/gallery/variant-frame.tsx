"use client"

import { CheckIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { CatalogueEntry } from "@/lib/gallery/catalogue"
import { useGalleryState } from "@/lib/gallery/state"
import type { Surface } from "@/lib/gallery/types"

/** Gallery chrome around one variant: what it is, where it came from, and "use this". */
export function VariantFrame({ surface, entry }: { surface: Surface; entry: CatalogueEntry }) {
  const [state, setState] = useGalleryState()
  const { meta, Demo } = entry
  const selected = state[surface] === meta.name

  return (
    <Card id={meta.name} className={selected ? "ring-2 ring-primary" : undefined}>
      <CardHeader className="border-b">
        <CardTitle className="flex flex-wrap items-center gap-2">
          {meta.title}
          <Badge variant="outline" className="font-mono font-normal">
            {meta.name}
          </Badge>
        </CardTitle>
        <CardDescription className="flex flex-col gap-1">
          <span>{meta.description}</span>
          <span>
            <span className="font-medium text-foreground">When: </span>
            {meta.whenToUse}
          </span>
          <span className="text-xs">Source: {meta.source}</span>
        </CardDescription>
        <CardAction>
          <Button
            size="sm"
            variant={selected ? "default" : "outline"}
            aria-pressed={selected}
            onClick={() => void setState({ [surface]: selected ? null : meta.name })}
          >
            {selected ? <CheckIcon data-icon="inline-start" /> : null}
            {selected ? "Selected" : "Use this"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Badge variant="secondary" className="self-start">
          Sample data
        </Badge>
        <div className="min-w-0 rounded-lg bg-background p-4 ring-1 ring-foreground/5">
          <Demo />
        </div>
      </CardContent>
    </Card>
  )
}
