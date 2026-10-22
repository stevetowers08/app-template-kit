import type { Surface, VariantMeta } from "@/lib/gallery/types"

import { cardHeaderVariants } from "./card-header/meta"
import { listVariants } from "./list/meta"
import { statCardVariants } from "./stat-card/meta"
import { tableVariants } from "./table/meta"

/**
 * Every variant, by surface. Pure data: safe to import from Node (the registry build)
 * and from the app. `Record<Surface, ...>` means a new surface fails to compile here
 * until it is wired in.
 */
export const VARIANTS_BY_SURFACE: Record<Surface, readonly VariantMeta[]> = {
  "card-header": cardHeaderVariants,
  "stat-card": statCardVariants,
  table: tableVariants,
  list: listVariants,
}

/** Shared foundation items every variant may depend on. */
export const FOUNDATION_ITEMS = [
  {
    name: "layout",
    title: "Layout primitives",
    description:
      "AppShell (the one scroll owner), Page (width and gutter), PageHeader (title, description, actions), Stack and Inline.",
    files: [
      "registry/latent/layout/app-shell.tsx",
      "registry/latent/layout/page.tsx",
      "registry/latent/layout/page-header.tsx",
      "registry/latent/layout/stack.tsx",
    ],
    dependencies: ["class-variance-authority"],
  },
  {
    name: "values",
    title: "Value display helpers",
    description:
      "Formatters that take number | null and an <Unmeasured /> marker, so an unknown value never renders as 0.",
    files: ["registry/latent/lib/values.tsx"],
    dependencies: [],
  },
] as const
