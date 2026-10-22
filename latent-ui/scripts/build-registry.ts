/**
 * Generates registry.json and app/looks.generated.css from the typed sources:
 *   - registry/latent/looks/looks.ts   (looks)
 *   - registry/latent/index.ts         (foundation items + every surface's meta.ts)
 *
 * Both outputs are generated. Edit the sources, then `npm run registry`.
 * Fails loudly (exit 1) on a duplicate name, a missing file, a variant whose name
 * does not start with its surface, or a shipped import that would break in a client
 * app (see checkImports) - never writes a partial registry.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

import ts from "typescript"

import { SURFACES } from "@/lib/gallery/types"
import { FOUNDATION_ITEMS, VARIANTS_BY_SURFACE } from "@/registry/latent"
import { LOOKS, type Look, type Mode, type TokenName } from "@/registry/latent/looks/looks"

const ROOT = process.cwd()
const REGISTRY_NAMESPACE = "@latent"
const errors: string[] = []

type RegistryFile = { path: string; type: string; target?: string }
type RegistryItem = {
  name: string
  type: string
  title: string
  description: string
  files?: RegistryFile[]
  dependencies?: string[]
  registryDependencies?: string[]
  cssVars?: { theme?: Record<string, string>; light?: Record<string, string>; dark?: Record<string, string> }
  meta?: Record<string, unknown>
}

function checkFiles(itemName: string, files: readonly string[]) {
  if (files.length === 0) errors.push(`${itemName}: no files`)
  for (const file of files) {
    if (!existsSync(path.join(ROOT, file))) errors.push(`${itemName}: missing file ${file}`)
  }
}

/**
 * `shadcn add` flattens files into components/ unless a target is given, which breaks
 * relative imports between an item's own files. Every shipped file keeps its path
 * under registry/latent/, rebased to components/latent/.
 */
function targetFor(file: string): string {
  return file.replace(/^registry\/latent\//, "components/latent/")
}

const SHARED_VALUES = "@/registry/latent/lib/values"
const RESOLVE_EXTENSIONS = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]

/**
 * Every import in a shipped file must still resolve after `shadcn add`:
 * - relative imports must point at a file the same item ships;
 * - `@/registry/latent/lib/values` is allowed (the CLI rewrites it to @/lib/values,
 *   and @latent/values is a registry dependency of every variant);
 * - any other `@/registry/latent/...` or gallery-only `@/lib/gallery/...` import fails.
 * Imports are read with TypeScript's own pre-processor, not a regex.
 */
function checkImports(itemName: string, files: readonly string[]) {
  const shipped = new Set(files.map((file) => path.normalize(file)))
  for (const file of files) {
    const source = readFileSync(path.join(ROOT, file), "utf8")
    const { importedFiles } = ts.preProcessFile(source, true, true)
    for (const { fileName: spec } of importedFiles) {
      if (spec.startsWith(".")) {
        const base = path.normalize(path.join(path.dirname(file), spec))
        const hit = RESOLVE_EXTENSIONS.map((ext) => base + ext).find((candidate) => shipped.has(candidate))
        if (!hit) errors.push(`${itemName}: ${file} imports "${spec}", which the item does not ship (add it to files)`)
      } else if (spec.startsWith("@/lib/gallery/")) {
        errors.push(`${itemName}: ${file} imports gallery-only "${spec}"`)
      } else if (spec.startsWith("@/registry/") && spec !== SHARED_VALUES) {
        errors.push(`${itemName}: ${file} imports "${spec}"; use a relative import to a shipped file`)
      }
    }
  }
}

const FONT_VAR: Record<Look["font"], string> = {
  geist: "var(--font-geist)",
  inter: "var(--font-inter)",
}

function lookTokens(look: Look, mode: Mode): Record<string, string> {
  const own = look[mode]
  // A single-mode look ships the same palette for both modes, so an app that
  // installs it renders the documented look whatever mode it is in.
  const tokens: Partial<Record<TokenName, string>> | undefined =
    own ?? (look.modes.length === 1 ? look[look.modes[0]] : undefined)
  return { ...(tokens ?? {}) }
}

// ---- Items -----------------------------------------------------------------

const items: RegistryItem[] = []

for (const item of FOUNDATION_ITEMS) {
  checkFiles(item.name, item.files)
  if (item.files.every((file) => existsSync(path.join(ROOT, file)))) checkImports(item.name, item.files)
  items.push({
    name: item.name,
    type: item.name === "values" ? "registry:lib" : "registry:block",
    title: item.title,
    description: item.description,
    // values keeps the default lib/ location: variants import it as @/lib/values.
    files: item.files.map((file) =>
      item.name === "values"
        ? { path: file, type: "registry:lib" }
        : { path: file, type: "registry:component", target: targetFor(file) }
    ),
    dependencies: [...item.dependencies],
  })
}

for (const look of LOOKS as readonly Look[]) {
  if (!look.light && !look.dark) errors.push(`look-${look.id}: no tokens for any mode`)
  // The font ships as a registry:font dependency (it wires next/font to --font-sans),
  // so the look does not set --font-sans itself; that is gallery-only (looks.generated.css).
  const light = { ...lookTokens(look, "light"), radius: look.radius }
  const dark = lookTokens(look, "dark")
  items.push({
    name: `look-${look.id}`,
    type: "registry:theme",
    title: `Look: ${look.title}`,
    description: `${look.description} Source: ${look.source}.`,
    registryDependencies: [`font-${look.font}`],
    cssVars: { light, dark },
    meta: { modes: look.modes },
  })
}

for (const surface of SURFACES) {
  for (const variant of VARIANTS_BY_SURFACE[surface]) {
    if (!variant.name.startsWith(`${surface}-`)) {
      errors.push(`${variant.name}: name must start with "${surface}-"`)
    }
    checkFiles(variant.name, variant.files)
    if (variant.files.every((file) => existsSync(path.join(ROOT, file)))) {
      checkImports(variant.name, variant.files)
    }
    items.push({
      name: variant.name,
      type: "registry:block",
      title: variant.title,
      description: variant.description,
      files: variant.files.map((file) => ({ path: file, type: "registry:component", target: targetFor(file) })),
      dependencies: [...(variant.dependencies ?? [])],
      registryDependencies: [
        `${REGISTRY_NAMESPACE}/values`,
        ...(variant.registryDependencies ?? []),
      ],
      meta: { surface, whenToUse: variant.whenToUse, source: variant.source },
    })
  }
}

const seen = new Set<string>()
for (const item of items) {
  if (seen.has(item.name)) errors.push(`duplicate item name: ${item.name}`)
  seen.add(item.name)
}

if (errors.length > 0) {
  console.error(`build-registry: ${errors.length} problem(s), nothing written:\n  - ${errors.join("\n  - ")}`)
  process.exit(1)
}

// ---- Outputs ---------------------------------------------------------------

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "latent",
  homepage: "https://github.com/stevetowers08/latent-ui",
  items,
}
writeFileSync(path.join(ROOT, "registry.json"), `${JSON.stringify(registry, null, 2)}\n`)

function cssBlock(selector: string, vars: Record<string, string>): string {
  const lines = Object.entries(vars).map(([name, value]) => `  --${name}: ${value};`)
  return lines.length ? `${selector} {\n${lines.join("\n")}\n}\n` : ""
}

const css: string[] = [
  "/* GENERATED by scripts/build-registry.ts from registry/latent/looks/looks.ts. Do not edit. */",
  "/* Light tokens are scoped :not(.dark) so a look's light palette never leaks into dark mode. */",
  "",
]
for (const look of LOOKS as readonly Look[]) {
  const base = `:root[data-look="${look.id}"]`
  css.push(cssBlock(base, { radius: look.radius, "font-sans": FONT_VAR[look.font] }))
  css.push(cssBlock(`${base}:not(.dark)`, lookTokens(look, "light")))
  css.push(cssBlock(`${base}.dark`, lookTokens(look, "dark")))
}
writeFileSync(path.join(ROOT, "app/looks.generated.css"), css.filter(Boolean).join("\n"))

const variantCount = SURFACES.reduce((n, s) => n + VARIANTS_BY_SURFACE[s].length, 0)
console.log(
  `build-registry: ${items.length} items (${FOUNDATION_ITEMS.length} foundation, ${LOOKS.length} looks, ${variantCount} variants)`
)
