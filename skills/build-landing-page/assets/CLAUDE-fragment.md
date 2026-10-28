<!--
  Paste this into the project's CLAUDE.md (or create one) BEFORE generating any UI.
  Fill every REPLACE marker with a literal value, never a description.
  "Modern" and "clean" are not constraints. "border-radius: 0" and "#C8FF00" are.
-->

## Design tokens (read before generating any UI)

Tokens live in `tokens.json` at repo root (or REPLACE with actual path). Colors,
spacing, radius, and type MUST resolve through semantic/component tokens —
never a raw hex, arbitrary Tailwind value, or default utility class
(`bg-blue-500`, `shadow-lg`, `rounded-2xl` on an unstyled default).

If a needed value is not in the token namespace, ASK before adding it. Do not
invent a new shade or spacing value to fill a gap.

## Anti-Generic Design Guardrails

- **Colors**: never a raw Tailwind palette class (`blue-500`, `indigo-600`) outside
  token definitions.
- **Typography**: never a single font with no pairing. Body: REPLACE (size/line-height/weight/family).
  Heading: REPLACE. Never Inter, Roboto, or a system font stack alone.
- **Shadows**: never bare `shadow-md`/`shadow-lg`. Use layered, tinted shadows
  defined in the token file, or border-only per the component's spec.
- **Motion**: animate `transform`/`opacity` only, never `transition-all`. Explicit
  durations 150-500ms, ease-out for entrances. Ship `prefers-reduced-motion` fallback.
- **Interactive states**: every interactive element defines hover, focus-visible,
  and active. No exceptions.
- **Images**: never a raw image with no treatment (overlay/tint/blend) UNLESS it's
  real photography being used deliberately as the anti-slop move (see brief).
- **Anti-patterns to actively avoid** (2026 AI-slop tells): centered hero + eyebrow
  pill + gradient headline + dual-button row; 3 identical icon-topped feature
  cards; untouched shadcn zinc/slate palette; `rounded-2xl shadow-lg` on every
  surface; reflexive glassmorphism; fake terminal-window/product-mockup card when
  there's no real product to show (use real photography instead); "Elevate your
  workflow"-style copy.

## Component manifests

Before writing a new component or using one from an installed registry, check
for a manifest at REPLACE (e.g. `components/**/*.manifest.yaml`) — see
`component-manifest-template.yaml` in this skill's assets/ for the shape. If a
manifest exists, follow its `when_to_use`/`when_not_to_use` rules and start
from its declared composition pattern rather than composing from memory.

## Reference

If a live competitor/inspiration site or brand assets were provided, they are
at REPLACE (path or URL list). Compare generated output against them using the
screenshot loop (see the skill's SKILL.md Step 6) before considering a section done.
