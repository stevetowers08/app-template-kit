"use client"

import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { getCatalogue } from "@/lib/gallery/catalogue"
import { SURFACE_LABELS, type Surface } from "@/lib/gallery/types"
import { Page } from "@/registry/latent/layout/page"
import { PageHeader } from "@/registry/latent/layout/page-header"

import { VariantFrame } from "./variant-frame"

export function SurfaceView({ surface }: { surface: Surface }) {
  const entries = getCatalogue(surface)
  const label = SURFACE_LABELS[surface]

  return (
    <Page width="wide">
      <PageHeader
        eyebrow={`${entries.length} variant${entries.length === 1 ? "" : "s"}`}
        title={label.title}
        description={`${label.description} Pick one with "Use this"; it goes into the recipe.`}
      />
      {entries.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No variants yet</EmptyTitle>
            <EmptyDescription>Add one in registry/latent/{surface}/meta.ts and demos.tsx.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className={label.columns === 2 ? "grid items-start gap-6 xl:grid-cols-2" : "grid gap-6"}>
          {entries.map((entry) => (
            <VariantFrame key={entry.meta.name} surface={surface} entry={entry} />
          ))}
        </div>
      )}
    </Page>
  )
}
