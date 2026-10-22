---
name: setup-landing-page-mockup
description: Build a believable animated "watch the app work" hero mockup for a landing page - the coded, live-DOM looping product-UI widget (chat panel typing, dashboard updating, cursor clicking through). Generates real DOM UI from the project's brand tokens, then choreographs it: staggered entrance, a simulated cursor (bezier glide or teleport), character-jitter typing, transform+opacity-only motion, IntersectionObserver scroll-trigger, and a prefers-reduced-motion fallback - then verifies by screenshot. Use whenever the user wants a landing-page hero mockup, an animated product demo widget, a fake-but-convincing app UI for a marketing page, a "show the product in motion" hero, or to recreate a reference UI as a looping mockup - even if they don't say "mockup". NOT the Remotion video path (that's /product-demo-video) and NOT in-app component motion (that's /setup-motion).
argument-hint: "[reference-image|url|brief] [--lottie|--rive] [--static]"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
disable-model-invocation: true
last_verified: 2026-08-21
---

# setup-landing-page-mockup

Build the **coded, live-DOM animated hero mockup** for a landing page - the looping "watch the app
work" widget (a chat panel typing a reply, a dashboard populating, a cursor clicking through a flow).
Real DOM UI drawn from the project's brand tokens, then choreographed to feel like a real person using
a real product. This is Technique B / the §8 build sequence of the vault's landing-page guide, made
runnable.

> When to use: "build a hero mockup", "animated product demo for the landing page", "fake app UI that
> types/updates on a loop", "recreate this screenshot as a looping mockup", "show the product in motion
> in the hero". Produces real components + motion; verifies by screenshot.

## Boundary with sibling skills (do not duplicate)

| You want | Use |
|---|---|
| A rendered **`.mp4`** / data-driven or personalised video, per-frame React | **`/product-demo-video`** (Remotion) - not this |
| **In-app** component motion you ship inside the product (buttons, toasts, drawers) | **`/setup-motion`** |
| A **no-code capture** of the real app (record + simulated cursor) | Navattic / Storylane / Arcade (see the vault guide §5A) - not a build |
| A **static** hero illustration (isometric/clay render) | AI image tools (Recraft/Midjourney/Ideogram) or Spline - see guide §1 |
| Score how the finished hero **looks** | **`/audit-frontend-design`** |

This skill owns the **coded live-DOM animated mockup**. It builds real components + choreography; it does
not render video and does not touch product UI.

## Tech choice (decide first, verified 2026)

**Default: coded CSS/WAAPI live-DOM.** A mockup must render believable, readable UI *text* - only real
DOM gives crisp, resolution-independent, accessible text and real component chrome from the brand tokens.
Lottie and Rive draw to canvas/GPU, so their "UI text" is rasterised - wrong for a fake-but-readable
interface. WAAPI now gets the same compositor/hardware acceleration as CSS, so use either for the 60fps
parts (`transform`/`opacity`).

- `--rive` - only when the hero is a **character/mascot** or genuinely interactive/stateful (state
  machines, ~60fps, ~10-15x smaller files than Lottie, but a ~200KB WASM runtime). Flag the cost.
- `--lottie` - only when a **designer hands you a decorative vector loop** (~50-60KB, playback-oriented).
- Neither is right for the product-UI mockup itself. Say so if the user asks for one.

## Procedure

1. **Get the source.** A reference screenshot/URL, or a text brief of the flow to show. If a reference
   image is given, extract don't guess (guide §2): sample real pixels for hex, read `font-family`/
   `radius`/`shadow` from DevTools if the page is live, name the exact typeface. If only a brief, use the
   project's own tokens/components.
2. **Load the brand contract.** Read the repo's `docs/design/` + `.claude/rules/branding.md` and the
   shared UI dir (`components/ui/` or `packages/ui/`). Build the mockup from **existing primitives and
   tokens** - never hardcode hex or hand-roll a card/button (reuse-first). One accent, neutral rest.
3. **Build the static frame first (get it pixel-right before any motion).** Real component chrome - card,
   rows, buttons, avatars - as a self-contained component (e.g. `components/marketing/HeroMockup.tsx`)
   with realistic-but-fake data. Reuse the in-app motion primitives (button press-scale, popover origin)
   so the fake UI behaves like the real product. No motion yet.
4. **Storyboard the loop as discrete beats.** List the actions: cursor moves -> click -> panel updates ->
   text types -> reset. Keep dwell times generous (AI-authored demos cycle too fast).
5. **Choreograph** using `references/build.md` (the §8 sequence, expanded to code): staggered entrance
   (`transform`+`opacity` only, ease-out, 40-120ms stagger), simulated cursor (bezier glide or teleport),
   **character-jitter typing (randomised 20-60ms, never fixed)**, tabular-nums on any counters.
6. **Trigger on scroll-into-view**, not page load - `IntersectionObserver`; pause when off-screen.
7. **Reduced-motion fallback** - under `prefers-reduced-motion`, render the finished end-state frame (or a
   plain opacity fade), not the cursor/typing choreography.
8. **Verify by screenshot.** Run the app, screenshot the hero at desktop (1440) + mobile (390) with
   Playwright, compare against the reference/brand, and iterate on spacing and feel. Motion feel: scrub /
   slow-mo in DevTools; confirm no layout-property animation.
9. **Report** the file(s) created, the tech chosen + why, and the next step (`/audit-frontend-design` to
   score the finished look).

## Rules

- **Reuse-first, tokens-only.** Build from the shared UI primitives + brand tokens; never hardcode a hex
  or hand-roll a primitive as a styled `<div>`. Flag a missing primitive, don't inline it.
- **Real DOM text for the UI mockup.** Don't rasterise the interface into Lottie/Rive - the readable-text
  fidelity is the whole point. Lottie/Rive only per the tech-choice table above.
- **`transform` + `opacity` only** for the animated parts (+ `filter`/`clip-path`). Never `width`/`top`/
  `left`/`margin`/`height` - the guide's top jank source.
- **The jitter is non-negotiable.** Fixed-interval typing is the #1 fake-demo tell; randomise 20-60ms.
- **Reduced-motion always**, and **scroll-trigger not autoplay**.
- **Verify by screenshot** before declaring done - reading code can't confirm spacing, contrast, or feel.
- Match the project's stack (React/Vite here); don't add a second animation library for what CSS/WAAPI does.

## See also

- `references/build.md` - the §8 build sequence expanded into concrete code patterns (cursor, jitter
  typing, scroll-trigger, reduced-motion)
- Video path: **`/product-demo-video`** · In-app motion: **`/setup-motion`** · Look critique:
  **`/audit-frontend-design`**
