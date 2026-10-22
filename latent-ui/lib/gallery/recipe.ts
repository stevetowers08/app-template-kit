import { getLook } from "@/registry/latent/looks/looks"

import { SURFACE_LABELS, SURFACES, type Surface } from "./types"

/** Where the @latent registry is served. Local dev server until it is deployed. */
export const REGISTRY_URL = process.env.NEXT_PUBLIC_LATENT_REGISTRY_URL ?? "http://localhost:3210"
export const REGISTRY_IS_LOCAL = !process.env.NEXT_PUBLIC_LATENT_REGISTRY_URL

export type Selections = Record<Surface, string | null>

/**
 * The text handed to Claude Code for a new app. Names registry items, never
 * describes components in prose, so the result is the exact code not a reinterpretation.
 */
export function buildRecipe(lookId: string, selections: Selections): string {
  const look = getLook(lookId)
  const chosen = SURFACES.filter((surface) => selections[surface] !== null)
  const items = [`@latent/look-${look.id}`, "@latent/layout", ...chosen.map((s) => `@latent/${selections[s]}`)]
  const modeNote = look.modes.length === 1 ? ` (${look.modes[0]} only)` : ""

  const lines = [
    "Latent UI recipe - build this app's UI from these registry items only.",
    "",
    `Look: look-${look.id}${modeNote}`,
    ...SURFACES.map(
      (surface) => `${SURFACE_LABELS[surface].title}: ${selections[surface] ?? "not chosen - ask before picking one"}`
    ),
    "",
    "Setup (Next.js app on shadcn base-nova):",
    "1. In components.json add registries:",
    `   "@latent": "${REGISTRY_URL}/r/{name}.json",`,
    '   "@reui": "https://reui.io/r/{style}/{name}.json",',
    '   "@diceui": "https://diceui.com/r/{style}/{name}.json"',
    `2. npx shadcn@latest add ${items.join(" ")}`,
    "3. Build every page from @latent/layout: AppShell (the one scroll owner), Page, PageHeader, Stack/Inline.",
    "4. Use only the variants above for card headers, stat cards, tables and lists. Do not hand-roll them.",
    "5. Unknown values render with <Unmeasured /> from lib/values, never as 0.",
  ]
  if (REGISTRY_IS_LOCAL) {
    lines.push("", `Note: the registry is served from a local dev server (${REGISTRY_URL}); run \`npm run dev\` in C:/dev/templates/latent-ui first.`)
  }
  return lines.join("\n")
}
