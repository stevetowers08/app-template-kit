"use client"

import * as React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useGalleryState } from "@/lib/gallery/state"
import { DEFAULT_LOOK, forcedModeFor, getLook } from "@/registry/latent/looks/looks"

/**
 * Applies the chosen look to <html data-look> (so portalled popovers get it too)
 * and forces the mode when the look's style page documents only one.
 *
 * The URL is read in <LookSync>, inside its own Suspense boundary: reading search
 * params at the root without one makes every page bail out of static rendering.
 */
export function GalleryProviders({ children }: { children: React.ReactNode }) {
  const [lookId, setLookId] = React.useState<string>(DEFAULT_LOOK)
  const look = getLook(lookId)

  return (
    <ThemeProvider forcedTheme={forcedModeFor(look) ?? undefined}>
      <TooltipProvider>
        <React.Suspense fallback={null}>
          <LookSync onLook={setLookId} />
        </React.Suspense>
        {children}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  )
}

function LookSync({ onLook }: { onLook: (lookId: string) => void }) {
  const [{ look }] = useGalleryState()

  React.useEffect(() => {
    document.documentElement.dataset.look = look
    onLook(look)
  }, [look, onLook])

  return null
}
