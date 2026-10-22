---
name: setup-motion
description: Set up a consistent, accessible motion system in a Next.js + React app - motion design tokens (durations/easings/stagger), a LazyMotion + MotionConfig provider, reusable m-component primitives (fade/slide/stagger/scroll-reveal), reduced-motion support, AnimatePresence exits, and native View Transitions for route swaps. Uses Motion 12-14 (motion/react) with the slim m + LazyMotion path (~5kb). Generator - to score motion compliance, run /audit-design-system. Use when adding or standardising animations/motion, page transitions, scroll reveals, or micro-interactions.
disable-model-invocation: true
argument-hint: ""
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
last_verified: 2026-10-21
---

# setup-motion

Implement a cohesive motion language: motion **tokens** (so one change re-times everything), a slim
provider, accessible reusable primitives, and native route transitions. Templates are in
`references/templates.md` (Motion 12-14, `motion/react`). **Generator only** - the scored compliance
check (motion-not-framer, `m`+LazyMotion, reduced-motion, tokens) is `audit-design-system`'s motion
dimension; run it after.

> When to use: "add a motion system", "set up animations / page transitions / scroll reveals", "make
> motion consistent". The `setup-` (scaffold) tier. Pairs with `/audit-design-system` (scores motion).

## Why these choices (verified 2026)

- **`motion/react`** (Motion 12-14) - `framer-motion` is the legacy package name; install `motion` (it
  depends on `framer-motion`).
- **styled-components / Emotion** - Motion 13+ has no optional `@emotion/is-prop-valid` support; pass
  `<MotionConfig isValidProp={isPropValid}>` to filter props forwarded to the DOM.
- **`m` + `LazyMotion`** - the full `motion` component can't tree-shake below ~43kb; `m`+LazyMotion is
  ~5kb. `strict` on LazyMotion throws if a full `motion` sneaks in.
- **`useReducedMotion` / `MotionConfig reducedMotion="user"`** - a11y is not optional (a material share
  of users enable OS Reduce Motion). **Gate the transition, not the component** (keep the `m.div` so
  layout still resolves).
- **Motion tokens** belong in the **design system** (`globals.css` + `docs/design/design.md`), so they're
  one source of truth and `audit-design-system` can check them.
- **Native View Transitions** for route swaps (more efficient than a JS library for large swaps). React
  `<ViewTransition>` does not honour `prefers-reduced-motion`; add a
  `@media (prefers-reduced-motion: reduce)` rule for the `::view-transition` pseudo-elements (snippet in
  `references/templates.md`).

## Procedure

1. **Audit current state** (light - the deep audit is `/audit-design-system`). Detect: Next version
   (React `<ViewTransition>` needs React 19.3; Next 16 needs no config), `motion` vs legacy `framer-motion`, existing motion tokens, a
   provider, and whether `m` (good) or full `motion` (heavy) is used. Report, then ask before writing.
2. **Install** `npm install motion` (and remove `framer-motion` if legacy). Migrate imports to `motion/react`.
3. **Add motion tokens** to `app/globals.css` + document them in `docs/design/design.md` (Motion section).
4. **Add the provider** (`LazyMotion features={domAnimation} strict` + `MotionConfig reducedMotion="user"`)
   to the root layout.
5. **Create primitives** in `components/ui/motion.tsx` (`m`-based: FadeIn, Stagger, scroll-reveal via
   `whileInView`), `AnimatePresence` for exits, `useScroll` for scroll-linked.
6. **Route transitions** - use React `<ViewTransition>` (React 19.3+; Next 16 needs no `next.config.ts`
   flag) or Motion `<AnimateView>` (`motion/react-animate-view`, Motion 13.4+, React 19.3+); add the
   reduced-motion CSS rule for the `::view-transition` pseudo-elements.
7. **Wire reduced-motion** through every transition (token-gated).
8. **Report** files written + the next step: `/audit-design-system` to score motion compliance.

## Rules

- **`motion/react` only** (plus `motion/react-animate-view` for `<AnimateView>`) - never legacy `framer-motion`; never the full `motion` component (use `m`).
- **Reduced-motion always** - gate the transition, never drop the component to a plain element.
- **Tokens, not magic numbers** - durations/easings/stagger come from the design tokens.
- **Generator only** - don't re-implement the motion audit here; defer to `/audit-design-system`.
- Match the project's design system + existing primitives; don't introduce a second animation library.

## See also
- `references/templates.md` - provider, tokens, primitives, View Transitions
- `/audit-design-system` - scores motion compliance (the audit half)
- `/setup-design-system` - the broader design-system generator this complements
