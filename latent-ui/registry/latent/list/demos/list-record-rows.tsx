"use client"

import { Building2Icon, GraduationCapIcon, PawPrintIcon, ScaleIcon, StethoscopeIcon, TruckIcon } from "lucide-react"
import type { ReactNode } from "react"

import { SAMPLE_CLIENTS, type ClientStatus } from "@/lib/gallery/sample-data"
import { ListRecordRows, type ListRecordRow } from "@/registry/latent/list/list-record-rows"

const INDUSTRY_ICON: Record<string, ReactNode> = {
  "Allied health": <StethoscopeIcon />,
  Accounting: <Building2Icon />,
  Education: <GraduationCapIcon />,
  Recruitment: <Building2Icon />,
  Veterinary: <PawPrintIcon />,
  Logistics: <TruckIcon />,
  Legal: <ScaleIcon />,
  Dental: <StethoscopeIcon />,
}

const STATUS_BADGE: Record<ClientStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  onboarding: { label: "Onboarding", variant: "secondary" },
  paused: { label: "Paused", variant: "outline" },
  churned: { label: "Churned", variant: "outline" },
}

const rows: readonly ListRecordRow[] = SAMPLE_CLIENTS.map((client) => ({
  id: client.id,
  href: `#${client.id}`,
  icon: INDUSTRY_ICON[client.industry] ?? <Building2Icon />,
  title: client.name,
  subtitle: client.industry,
  badge: STATUS_BADGE[client.status],
}))

export function ListRecordRowsDemo() {
  return <ListRecordRows rows={rows} />
}
