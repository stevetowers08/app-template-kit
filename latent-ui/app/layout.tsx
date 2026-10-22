import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import "./globals.css"
import { GalleryProviders } from "@/components/gallery/providers"
import { cn } from "@/lib/utils"

// Each look picks one of these via --font-sans (see app/looks.generated.css).
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Latent UI",
  description: "Compare looks and component variants, then hand the recipe to Claude Code.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en-AU"
      data-look="neutral"
      suppressHydrationWarning
      className={cn("antialiased font-sans", geist.variable, inter.variable, fontMono.variable)}
    >
      <body>
        <NuqsAdapter>
          <GalleryProviders>{children}</GalleryProviders>
        </NuqsAdapter>
      </body>
    </html>
  )
}
