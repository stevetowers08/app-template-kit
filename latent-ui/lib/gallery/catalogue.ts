import { cardHeaderDemos } from "@/registry/latent/card-header/demos"
import { listDemos } from "@/registry/latent/list/demos"
import { statCardDemos } from "@/registry/latent/stat-card/demos"
import { tableDemos } from "@/registry/latent/table/demos"
import { VARIANTS_BY_SURFACE } from "@/registry/latent"

import type { Demo, Surface, VariantMeta } from "./types"

const DEMOS_BY_SURFACE: Record<Surface, Readonly<Record<string, Demo>>> = {
  "card-header": cardHeaderDemos,
  "stat-card": statCardDemos,
  table: tableDemos,
  list: listDemos,
}

export type CatalogueEntry = { readonly meta: VariantMeta; readonly Demo: Demo }

export function getCatalogue(surface: Surface): readonly CatalogueEntry[] {
  const demos = DEMOS_BY_SURFACE[surface]
  return VARIANTS_BY_SURFACE[surface].map((meta) => {
    const Demo = demos[meta.name]
    // The per-surface `satisfies Record<Name, Demo>` makes this unreachable; keep the
    // throw so a hand-edited cast cannot turn a missing demo into a blank card.
    if (!Demo) throw new Error(`No demo for variant "${meta.name}" (${surface})`)
    return { meta, Demo }
  })
}

export function findVariant(surface: Surface, name: string | null): CatalogueEntry | null {
  if (!name) return null
  return getCatalogue(surface).find((entry) => entry.meta.name === name) ?? null
}
