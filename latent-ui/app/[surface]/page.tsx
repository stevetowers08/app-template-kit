import { notFound } from "next/navigation"

import { GalleryFrame } from "@/components/gallery/gallery-frame"
import { SurfaceView } from "@/components/gallery/surface-view"
import { SURFACES, type Surface } from "@/lib/gallery/types"

export function generateStaticParams() {
  return SURFACES.map((surface) => ({ surface }))
}

function isSurface(value: string): value is Surface {
  return (SURFACES as readonly string[]).includes(value)
}

export default async function SurfacePage({ params }: { params: Promise<{ surface: string }> }) {
  const { surface } = await params
  if (!isSurface(surface)) notFound()
  return (
    <GalleryFrame>
      <SurfaceView surface={surface} />
    </GalleryFrame>
  )
}
