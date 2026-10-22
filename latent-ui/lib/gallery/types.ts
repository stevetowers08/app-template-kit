import type { ComponentType } from "react"

/**
 * The four surfaces the gallery compares. Adding a surface is a type change on
 * purpose: every `Record<Surface, ...>` below then fails to compile until the new
 * surface is wired into the catalogue, the nav and the recipe.
 */
export const SURFACES = ["card-header", "stat-card", "table", "list"] as const
export type Surface = (typeof SURFACES)[number]

/** `columns`: how many variants sit side by side on wide screens. Wide demos (stat grids, tables) get 1. */
export const SURFACE_LABELS: Record<Surface, { title: string; description: string; columns: 1 | 2 }> = {
  "card-header": {
    title: "Card headers",
    description: "Title, description and actions at the top of a card or panel.",
    columns: 2,
  },
  "stat-card": {
    title: "Stat cards",
    description: "One headline number with its label, change and context.",
    columns: 1,
  },
  table: {
    title: "Tables",
    description: "Rows of records to scan, sort, compare and act on.",
    columns: 1,
  },
  list: {
    title: "Lists",
    description: "Clickable rows, feeds and item lists that are not a data table.",
    columns: 2,
  },
}

/**
 * Metadata for one variant. This is the single source for both the gallery and the
 * generated registry.json (scripts/build-registry.ts). Never hand-edit registry.json.
 */
export type VariantMeta = {
  /** Registry item name, also the recipe id. Must start with the surface name. */
  readonly name: string
  readonly title: string
  /** Anatomy in one line: what the user sees, top to bottom. */
  readonly description: string
  /** When to reach for this variant instead of its siblings. */
  readonly whenToUse: string
  /** Where it came from: an existing app file, a ReUI/Dice UI item, or "new". */
  readonly source: string
  /** Repo-relative paths of the files the registry item ships. */
  readonly files: readonly string[]
  /** npm packages the files import (beyond react). */
  readonly dependencies?: readonly string[]
  /** shadcn items (bare names) or namespaced items ("@reui/badge", "@diceui/stat"). */
  readonly registryDependencies?: readonly string[]
}

/** A demo renders one variant with sample data, for the gallery only. */
export type Demo = ComponentType

export type SurfaceCatalogue = {
  readonly surface: Surface
  readonly variants: readonly VariantMeta[]
  readonly demos: Readonly<Record<string, Demo>>
}
