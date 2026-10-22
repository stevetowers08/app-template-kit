"use client"

import { MessageSquareIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SAMPLE_CLIENTS, type ClientStatus } from "@/lib/gallery/sample-data"
import { ListItemOutline, type ListItemOutlineRow } from "@/registry/latent/list/list-item-outline"

const STATUS_BADGE: Record<ClientStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  onboarding: { label: "Onboarding", variant: "secondary" },
  paused: { label: "Paused", variant: "outline" },
  churned: { label: "Churned", variant: "outline" },
}

const rows: readonly ListItemOutlineRow[] = SAMPLE_CLIENTS.map((client) => ({
  id: client.id,
  href: `#${client.id}`,
  initials: client.owner.initials,
  title: client.name,
  meta: `${client.industry} · ${client.owner.name}`,
  badge: STATUS_BADGE[client.status],
  actions: (
    <Button size="icon-sm" variant="ghost" aria-label={`Message ${client.owner.name}`}>
      <MessageSquareIcon />
    </Button>
  ),
}))

export function ListItemOutlineDemo() {
  return <ListItemOutline rows={rows} />
}
