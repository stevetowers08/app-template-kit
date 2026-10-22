"use client"

import { SAMPLE_CLIENTS } from "@/lib/gallery/sample-data"
import { formatValue } from "@/registry/latent/lib/values"
import { ListHoverRows, type ListHoverRow } from "@/registry/latent/list/list-hover-rows"

const rows: readonly ListHoverRow[] = SAMPLE_CLIENTS.map((client) => ({
  id: client.id,
  href: `#${client.id}`,
  title: client.name,
  meta: client.industry,
  primaryFigure: formatValue(client.mrr, "currency") ?? "No billing",
  secondaryFigure: `${client.agents} agent${client.agents === 1 ? "" : "s"}`,
}))

export function ListHoverRowsDemo() {
  return <ListHoverRows title="Clients" rows={rows} />
}
