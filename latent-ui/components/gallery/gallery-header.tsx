"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { CopyIcon, MoonIcon, SunIcon } from "lucide-react"
import { toast } from "sonner"

import { Button, buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { buildRecipe } from "@/lib/gallery/recipe"
import { useGalleryState } from "@/lib/gallery/state"
import { SURFACE_LABELS, SURFACES } from "@/lib/gallery/types"
import { cn } from "@/lib/utils"
import { forcedModeFor, getLook, LOOKS } from "@/registry/latent/looks/looks"

const NAV = [
  { href: "/", label: "Overview" },
  ...SURFACES.map((surface) => ({ href: `/${surface}`, label: SURFACE_LABELS[surface].title })),
]

function subscribeNoop() {
  return () => {}
}

export function GalleryHeader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const query = searchParams.toString()
  const [state, setState] = useGalleryState()
  const look = getLook(state.look)
  const forcedMode = forcedModeFor(look)
  const { resolvedTheme, setTheme } = useTheme()
  // next-themes only knows the resolved theme on the client; render the toggle's
  // pressed state after mount so server and client HTML match.
  const mounted = React.useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  )
  const modeValue = forcedMode ?? (mounted ? resolvedTheme : undefined)

  async function handleCopyRecipe() {
    const { look: lookId, ...selections } = state
    try {
      await navigator.clipboard.writeText(buildRecipe(lookId, selections))
      toast.success("Recipe copied", { description: "Paste it into Claude Code in the new app." })
    } catch {
      toast.error("Could not copy", { description: "Open the Overview page and copy the recipe text by hand." })
    }
  }

  return (
    <div className="shrink-0 border-b bg-background">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 md:px-6">
        <Link href={query ? `/?${query}` : "/"} className="font-heading text-sm font-semibold tracking-tight">
          Latent UI
        </Link>
        <nav aria-label="Surfaces" className="flex flex-wrap items-center gap-1">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={query ? `${item.href}?${query}` : item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  active && "bg-muted text-foreground"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select
            value={look.id}
            onValueChange={(value) => void setState({ look: value as typeof state.look })}
            items={LOOKS.map((l) => ({ value: l.id, label: l.title }))}
          >
            <SelectTrigger size="sm" aria-label="Look" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOOKS.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <ToggleGroup
                variant="outline"
                size="sm"
                value={modeValue ? [modeValue] : []}
                onValueChange={(value) => {
                  const next = value[0]
                  if (next) setTheme(next)
                }}
                disabled={forcedMode !== null}
                aria-label="Colour mode"
              >
                <ToggleGroupItem value="light" aria-label="Light">
                  <SunIcon />
                </ToggleGroupItem>
                <ToggleGroupItem value="dark" aria-label="Dark">
                  <MoonIcon />
                </ToggleGroupItem>
              </ToggleGroup>
            </TooltipTrigger>
            <TooltipContent>
              {forcedMode
                ? `${look.title} is documented in ${forcedMode} mode only`
                : "Switch colour mode (D)"}
            </TooltipContent>
          </Tooltip>
          <Button size="sm" onClick={handleCopyRecipe}>
            <CopyIcon data-icon="inline-start" />
            Copy recipe
          </Button>
        </div>
      </div>
    </div>
  )
}
