/**
 * Looks: the global colour, font, radius and elevation layer. One look per client.
 *
 * Source of truth for BOTH app/looks.generated.css (the gallery switcher) and the
 * `@latent/look-*` registry items. Regenerate with `npm run registry`.
 *
 * Values come from the vault style pages (Wiki/Frontend/Design System/<Style>.md).
 * A token a style page does not document is left out on purpose, so it falls back
 * to the shadcn neutral default in app/globals.css rather than an invented value.
 * Density and component shape are NOT here: they belong to the shadcn style
 * (base-nova) and to each variant, per Wiki/Frontend/Foundations/Spacing & Density System.
 */

export type Mode = "light" | "dark"

/** shadcn semantic tokens a look may set (names without the leading `--`). */
export type TokenName =
  | "background"
  | "foreground"
  | "card"
  | "card-foreground"
  | "popover"
  | "popover-foreground"
  | "primary"
  | "primary-foreground"
  | "secondary"
  | "secondary-foreground"
  | "muted"
  | "muted-foreground"
  | "accent"
  | "accent-foreground"
  | "border"
  | "input"
  | "ring"
  | "success"
  | "surface-shadow"

export type Look = {
  readonly id: string
  readonly title: string
  readonly description: string
  /** Vault page the values were taken from. */
  readonly source: string
  /** Modes the style page documents. The gallery forces the only mode when there is one. */
  readonly modes: readonly Mode[]
  readonly font: "geist" | "inter"
  /** Base radius. Cards use rounded-xl = 1.4x this in base-nova. */
  readonly radius: string
  readonly light?: Partial<Record<TokenName, string>>
  readonly dark?: Partial<Record<TokenName, string>>
}

export const LOOKS = [
  {
    id: "neutral",
    title: "Neutral",
    description: "shadcn base-nova defaults. The baseline every other look is compared against.",
    source: "shadcn base-nova defaults (app/globals.css)",
    modes: ["light", "dark"],
    font: "geist",
    radius: "0.625rem",
    light: { "surface-shadow": "0 0 #0000" },
    dark: { "surface-shadow": "0 0 #0000" },
  },
  {
    id: "linear",
    title: "Linear",
    description:
      "Near-black canvas, luminance-stacked surfaces, hairline borders, one lavender accent, 8px card ceiling.",
    source: "Wiki/Frontend/Design System/Linear.md",
    modes: ["dark"],
    font: "inter",
    // Cards render at rounded-xl (1.4x) = 8.4px, the documented in-app ceiling of ~8px.
    radius: "0.375rem",
    dark: {
      background: "#010102",
      foreground: "#f7f8f8",
      card: "#0f1011",
      "card-foreground": "#f7f8f8",
      popover: "#18191a",
      "popover-foreground": "#f7f8f8",
      primary: "#5e6ad2",
      "primary-foreground": "#f7f8f8",
      secondary: "#141516",
      "secondary-foreground": "#d0d6e0",
      muted: "#141516",
      "muted-foreground": "#8a8f98",
      accent: "#18191a",
      "accent-foreground": "#f7f8f8",
      border: "#23252a",
      input: "#34343a",
      ring: "#5e69d1",
      success: "#27a644",
      "surface-shadow": "0 0 #0000",
    },
  },
  {
    id: "vercel",
    title: "Vercel / Geist",
    description:
      "Near-white canvas, white cards, hairline dividers, ink primary, one functional blue for focus, Geist type.",
    source: "Wiki/Frontend/Design System/Vercel - Geist.md",
    modes: ["light", "dark"],
    font: "geist",
    // material-base is 6px; cards render at 8.4px.
    radius: "0.375rem",
    light: {
      background: "#fafafa",
      foreground: "#171717",
      card: "#ffffff",
      "card-foreground": "#171717",
      popover: "#ffffff",
      "popover-foreground": "#171717",
      primary: "#171717",
      "primary-foreground": "#ffffff",
      muted: "#f5f5f5",
      accent: "#f5f5f5",
      ring: "#0070f3",
      "surface-shadow": "0 0 #0000",
    },
    dark: {
      primary: "#ededed",
      "primary-foreground": "#171717",
      ring: "#0070f3",
      "surface-shadow": "0 0 #0000",
    },
  },
  {
    id: "stripe",
    title: "Stripe",
    description:
      "White canvas, cool off-white bands, hairline borders plus a barely-there shadow, indigo accent for CTAs only.",
    source: "Wiki/Frontend/Design System/Stripe.md",
    modes: ["light"],
    font: "inter",
    radius: "0.375rem",
    light: {
      background: "#ffffff",
      card: "#ffffff",
      popover: "#ffffff",
      primary: "#635bff",
      "primary-foreground": "#ffffff",
      muted: "#f6f9fc",
      secondary: "#f6f9fc",
      accent: "#f6f9fc",
      border: "#e3e8ee",
      input: "#e3e8ee",
      ring: "#635bff",
      "surface-shadow": "0 1px 3px rgba(0, 55, 112, 0.08)",
    },
  },
  {
    id: "notion",
    title: "Notion",
    description:
      "Warm charcoal text on white, warm off-white surfaces, flat hairline cards, one purple for the main CTA, softer radius.",
    source: "Wiki/Frontend/Design System/Notion.md",
    modes: ["light"],
    font: "inter",
    // Buttons 8px, cards rounded-xl = 11.2px (documented 12px, floor of 5px).
    radius: "0.5rem",
    light: {
      background: "#ffffff",
      foreground: "#37352f",
      card: "#ffffff",
      "card-foreground": "#37352f",
      popover: "#ffffff",
      "popover-foreground": "#37352f",
      primary: "#5645d4",
      "primary-foreground": "#ffffff",
      muted: "#f6f5f4",
      secondary: "#f6f5f4",
      accent: "#fafaf9",
      border: "#e5e3df",
      input: "#c8c4be",
      ring: "#5645d4",
      "surface-shadow": "0 0 #0000",
    },
  },
] as const satisfies readonly Look[]

export type LookId = (typeof LOOKS)[number]["id"]

export const DEFAULT_LOOK: LookId = "neutral"

export function getLook(id: string | null | undefined): Look {
  return LOOKS.find((look) => look.id === id) ?? LOOKS[0]
}

/** The mode a look must render in, or null when it supports both. */
export function forcedModeFor(look: Look): Mode | null {
  return look.modes.length === 1 ? look.modes[0] : null
}
