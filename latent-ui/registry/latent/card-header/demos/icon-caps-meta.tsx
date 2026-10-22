import { UsersIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SAMPLE_CLIENTS } from "@/lib/gallery/sample-data"
import { DisplayValue } from "@/registry/latent/lib/values"

import { CardHeaderIconCapsMeta } from "../card-header-icon-caps-meta"

export function CardHeaderIconCapsMetaDemo() {
  const clients = SAMPLE_CLIENTS.filter((client) => client.status === "active").slice(0, 3)
  return (
    <CardHeaderIconCapsMeta
      icon={<UsersIcon />}
      label="Active clients"
      meta={`${clients.length} of ${SAMPLE_CLIENTS.length}`}
      actions={<Button variant="ghost" size="sm">Manage</Button>}
    >
      <ul className="flex flex-col gap-2">
        {clients.map((client) => (
          <li key={client.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{client.name}</span>
            <span className="text-muted-foreground">
              <DisplayValue value={client.mrr} unit="currency" compact />
            </span>
          </li>
        ))}
      </ul>
    </CardHeaderIconCapsMeta>
  )
}
