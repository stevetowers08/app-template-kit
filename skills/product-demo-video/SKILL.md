---
name: product-demo-video
description: >-
  Produce a polished SaaS product-demo / explainer / feature-launch video end-to-end with Remotion (React → real MP4). Use this whenever the user wants a product demo video, explainer video, SaaS walkthrough or feature-launch clip, an animated product-UI mockup video, a "show the product in motion" hero video, or a data-driven/personalised video — even if they don't say "Remotion" by name. Drives the whole pipeline: brief → scaffold → scene + cursor choreography → beat-aligned pacing → Remotion Studio iteration → render.
---

# Product Demo Video (Remotion, end-to-end)

You are directing a short (20-45s) product-demo video, not just writing animation code. Craft compounds: the pacing, the cursor path, the beat alignment, and the restraint are what separate a video that looks shipped from one that looks like a placeholder.

**This skill orchestrates; two companions supply the depth — load both up front:**
- **Mechanics → the official `remotion-best-practices` skill.** If it isn't installed, install it: `npx skills add remotion-dev/skills`. It owns the ~40 rule files (timing, transitions, effects, captions, audio, cursor, calculate-metadata, etc.). This skill tells you *what to build and in what order*; that skill tells you *exactly how* each piece works. Consult its `rules/` files as you hit each need.
- **The why + reference → the Obsidian note** at `<knowledge-base>/Growth & Marketing/Landing Pages/Remotion - Programmatic Video.md`. Read it once at the start. It has the deterministic per-frame model, the verified cursor-storyboard technique, the avoid-list, and the capture-tool-vs-Remotion decision. Keep it as the source of truth; if you learn something durable while building, tell the user so they can update that note (don't fork knowledge into the skill).

## The pipeline

### 1. Brief (ask before building — a vague brief produces a generic video)
Get: **audience** (who watches), **the one message** (if they remember one thing, what is it), **3-5 beats** (the ordered moments/features to show), **duration** (default 30s) and **aspect ratio** (16:9 landing hero / 9:16 social / 1:1), **brand** (colours as hex, font, logo), **soundtrack** (file or none), **real UI or schematic** (do they have screenshots/a running app, or do we draw a schematic mockup?), and the **CTA / end card**. If they can't answer the "one message," push on it — it's the spine every scene serves.

### 2. Scaffold
Empty workspace → `npx create-video@latest --yes --blank my-demo` (drop `--no-tailwind` only if they want Tailwind; static Tailwind is fine, animation classes are not). Then `npx remotion studio` for the hot-reloading preview at `localhost:3000` — this feedback loop is the whole point; every change is verifiable in ~2s.

### 3. Storyboard with scene-relative timing (do NOT hardcode absolute frame numbers)
Lay out one `<Sequence>` per beat. **Reference scene names/offsets, never raw frame numbers** — the single biggest lesson from production use: changing one scene's length otherwise breaks every downstream cursor waypoint and reveal. Keep a `scene-frames.ts` (or equivalent) that computes each scene's start from the durations before it. If there's a soundtrack, **snap scene boundaries to the beat** (detect beats from the audio; align in-scene events to the nearest beat within tolerance) — beat-locked cuts are most of why a demo feels professional.

### 4. Build each scene
- **UI: real or schematic.** If they gave screenshots/components, composite those. If not, build **schematic mockups** — clean, on-brand approximations of the product UI (a sidebar, a table, a form) rather than trying to fake pixel-perfect real UI. Schematic reads as intentional; a bad fake reads as cheap.
- **Cursor choreography (only if it earns its place — see anti-slop below).** The cursor is an image moved by `interpolate(frame, waypoints)`. Rules that avoid the #1 churn ("the cursor missed the button"):
  - **Anchor clicks to element geometry**, not guessed x/y — target the real element's position so a click actually lands on it (and, ideally, the clicked element genuinely responds).
  - **Bezier easing on the path** (`Easing.bezier(0.16, 1, 0.3, 1)`), arcs not linear — no robotic glides.
  - A **click = press dip + ripple + a frame-gated state reveal** (render the next panel once `frame > clickFrame`). Wire the reveal to the click frame so they stay in sync when you retime.
  - Don't hand-roll the cursor — copy a ready-made primitive (RemotionUI `SimulatedCursor`, or a `Cursor.tsx` from the source templates).
- **Animation primitives (build a small reusable set, reuse across scenes for cohesion):** `TypedText` (typewriter with *randomised* per-char delay, never a fixed interval), `PopIn`, `MaskReveal`, `Counter` (number ticks up), `ZoomPunch`/camera push-ins for emphasis, `BRoll`/background layers. Once scene 1's vocabulary locks, the rest inherit it and finish fast.
- **Follow the mechanics rules** (from the official skill): keep `interpolate()` inline in the `style` prop and animate individual `scale`/`translate`/`rotate` props (stays editable in Studio); always `extrapolateRight: "clamp"`; multiply frame counts by `fps` from `useVideoConfig()`; **no CSS transitions / Tailwind `animate-*` / `setTimeout` / `Date.now()`** — they don't render. Load fonts via `@remotion/google-fonts` (a missing font import is the usual "looks slightly off").

### 5. Pacing — slow down
Your instinct (and the AI default) is to cycle through visuals too fast to read. Err long: a beat that feels slightly slow to *you* is usually right for a first-time viewer. Expect to roughly **double dwell times** on the first pass. Before rendering typed text, check it actually fits its scene's duration (a "typing budget" check) — text that's still typing when the scene cuts looks broken.

### 6. Iterate in Studio, then one-frame checks
Build scene 1, get it to feel right with the user (this is where most of the time goes; the rest inherit the style). Use `npx remotion still [id] --scale=0.25 --frame=N` to sanity-check a specific moment's layout/colour without a full render.

### 7. Anti-slop pass before render
- **Cut the cursor if it doesn't genuinely interact.** Two experienced practitioners removed their fake cursor — "it looked like a placeholder for an interaction that wasn't there." A cursor floating over static UI reads as cheap. Keep it only if the UI responds to it or it adds real clarity.
- **Scan for AI tells:** em-dashes and curly quotes rendered on screen, uniform typing intervals, everything-animates-at-once (add 30-80ms stagger), symmetric enter/exit timing (make exits snappier).
- **Ground it in real data** where possible — real numbers/names read as credible; lorem-ipsum reads as marketing.

### 8. Render
`npx remotion render [composition-id] out/demo.mp4`. For **many personalised videos** (per-customer/per-account), make the composition data-driven via `calculateMetadata` (fetch each row's data → set duration/props) and render on `@remotion/lambda` in parallel — the mail-merge-for-video pattern.

## When NOT to use this
A one-off talking-head or screen recording (use a normal editor/capture tool — Navattic/Storylane/Arcade record the *real* app; see the Obsidian note's comparison). In-app UI motion is CSS/Framer Motion, not this. This skill is for **coded, on-brand, data-capable demo/explainer videos** where you're drawing the story frame-by-frame.

## References
- Mechanics: the `remotion-best-practices` skill's `rules/` (start with `video-layout`, `timing`, `transitions`, `effects`; `calculate-metadata` for data-driven; `audio-visualization`/`voiceover` if there's sound).
- The why + decisions: `<knowledge-base>/Growth & Marketing/Landing Pages/Remotion - Programmatic Video.md`.
- Source templates this was synthesised from (pull code/primitives if useful): noamdorr/saas-product-demo-video (questionnaire, beat detection, schematic mockups, click-positioning playbook, AI-tell checker), and Bojan Josifoski's remotion-cinematic (geometry-anchored cursor, camera rig, UIKeyframe state-on-a-timeline synced to cursor actions).
