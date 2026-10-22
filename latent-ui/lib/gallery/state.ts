"use client"

import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs"

import { LOOKS } from "@/registry/latent/looks/looks"

import type { Surface } from "./types"

const LOOK_IDS = LOOKS.map((look) => look.id)

/**
 * All gallery state lives in the URL, so a chosen combination is a shareable link
 * and survives a refresh. Keys match the surface ids.
 */
export const galleryParsers = {
  look: parseAsStringLiteral(LOOK_IDS).withDefault("neutral"),
  "card-header": parseAsString,
  "stat-card": parseAsString,
  table: parseAsString,
  list: parseAsString,
} satisfies Record<"look" | Surface, unknown>

export function useGalleryState() {
  return useQueryStates(galleryParsers, { history: "replace" })
}
