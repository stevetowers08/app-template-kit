import { Suspense } from "react"

import { AppShell } from "@/registry/latent/layout/app-shell"

import { GalleryHeader } from "./gallery-header"

/** The gallery's own shell, built from the same AppShell it ships. */
export function GalleryFrame({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      header={
        // useSearchParams needs a Suspense boundary for static rendering.
        <Suspense fallback={<div className="h-12 shrink-0 border-b" />}>
          <GalleryHeader />
        </Suspense>
      }
    >
      <Suspense>{children}</Suspense>
    </AppShell>
  )
}
