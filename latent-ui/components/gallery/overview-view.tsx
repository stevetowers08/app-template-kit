"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRightIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { findVariant, getCatalogue } from "@/lib/gallery/catalogue"
import { buildRecipe } from "@/lib/gallery/recipe"
import { useGalleryState } from "@/lib/gallery/state"
import { SURFACE_LABELS, SURFACES } from "@/lib/gallery/types"
import { Page } from "@/registry/latent/layout/page"
import { PageHeader } from "@/registry/latent/layout/page-header"
import { Stack } from "@/registry/latent/layout/stack"
import { getLook } from "@/registry/latent/looks/looks"

export function OverviewView() {
  const [state] = useGalleryState()
  const query = useSearchParams().toString()
  const { look: lookId, ...selections } = state
  const look = getLook(lookId)

  return (
    <Page width="wide">
      <PageHeader
        eyebrow={`Look: ${look.title}`}
        title="Pick a look, then one variant per surface"
        description="The look sets colours, fonts, radius and elevation. Each surface page shows every variant; the ones you pick go into the recipe below. Copy the recipe into Claude Code when starting a new app."
      />

      <Stack gap={6}>
        {SURFACES.map((surface) => {
          const entry = findVariant(surface, selections[surface])
          const total = getCatalogue(surface).length
          const href = query ? `/${surface}?${query}` : `/${surface}`
          return (
            <Card key={surface}>
              <CardHeader className="border-b">
                <CardTitle>{SURFACE_LABELS[surface].title}</CardTitle>
                <CardDescription>
                  {entry ? (
                    <span className="font-mono">{entry.meta.name}</span>
                  ) : (
                    `Not chosen yet (${total} variant${total === 1 ? "" : "s"} to compare)`
                  )}
                </CardDescription>
                <CardAction>
                  <Link href={href} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    {entry ? "Change" : "Compare"}
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </CardAction>
              </CardHeader>
              <CardContent>
                {entry ? (
                  <entry.Demo />
                ) : (
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No {SURFACE_LABELS[surface].title.toLowerCase()} variant chosen</EmptyTitle>
                      <EmptyDescription>The recipe will tell Claude Code to ask before picking one.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </CardContent>
            </Card>
          )
        })}

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Recipe</CardTitle>
            <CardDescription>
              Registry item names, not descriptions, so Claude Code installs the exact code.
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">Updates as you pick</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {buildRecipe(lookId, selections)}
            </pre>
          </CardContent>
        </Card>
      </Stack>
    </Page>
  )
}
