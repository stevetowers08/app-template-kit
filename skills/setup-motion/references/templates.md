# setup-motion — templates (Motion 12-14, `motion/react`, Next.js 16)

Use the slim `m` + `LazyMotion` path (~5kb vs ~43kb for full `motion`). Import from **`motion/react`**
(never legacy `framer-motion`). Gate transitions with `useReducedMotion` (gate the *transition*, not the
component — gating the component breaks layout animations).

## 1. Motion tokens — in the design system (`app/globals.css`)
Tokens, so one change re-times everything (same principle as colour/spacing tokens).
```css
:root {
  --duration-fast: 150ms;  --duration-base: 250ms;  --duration-slow: 400ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --stagger: 0.06s;
}
```
Document them in `docs/design/design.md` under a Motion section (so `audit-design-system` can check them).

## 2. Provider — `components/providers/motion-provider.tsx`
```tsx
"use client";
import { LazyMotion, domAnimation, MotionConfig } from "motion/react";
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    // strict: throws if a full `motion` component is used instead of `m` (protects the bundle win)
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">  {/* respects OS Reduce-Motion globally */}
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
```
Mount in the root layout. `domAnimation` (+24kb) covers animate/variants/exit/hover/tap/focus; use
`domMax` (+38kb) only if you need drag/layout animations; or a dynamic `features={loadFeatures}` import.

## 3. Primitives — `components/ui/motion.tsx` (use `m`, variants, whileInView)
```tsx
"use client";
import { m, useReducedMotion } from "motion/react";

export function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <m.div
      initial={{ opacity: 0, y: reduce ? 0 : 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={reduce ? { duration: 0 } : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >{children}</m.div>
  );
}

// Staggered list: parent propagates the variant; children resolve it + delayChildren: stagger(...)
import { stagger } from "motion/react";
const list = { show: { transition: { delayChildren: stagger(0.06) } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
export function Stagger({ children }: { children: React.ReactNode }) {
  return <m.ul initial="hidden" whileInView="show" viewport={{ once: true }} variants={list}>{children}</m.ul>;
}
export const StaggerItem = ({ children }: { children: React.ReactNode }) => <m.li variants={item}>{children}</m.li>;
```
Exit animations: wrap conditional unmounts in `<AnimatePresence>` with **stable keys** (modals, toasts,
dropdowns). Scroll-linked (progress/parallax): `useScroll` returns a MotionValue (no re-render).

## 4. Route transitions — prefer the native View Transitions API
React 19.3 ships a stable `<ViewTransition>` (import from `react`); Next 16 needs no `next.config.ts` flag.
Native view transitions are more efficient for large route swaps. Motion's `animateView()` ships in
`motion` (12.41.0+), and `<AnimateView>` (import from `motion/react-animate-view`, Motion 13.4+, React 19.3+)
needs no Motion+ licence. Use them when you need shared-element springs; otherwise the native API keeps
the bundle smaller.

React `<ViewTransition>` does not honour `prefers-reduced-motion`; disable the animation in CSS:
```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) {
    animation: none !important;
  }
}
```

## Reduced-motion rule (a11y — a material share of users enable OS Reduce Motion)
`MotionConfig reducedMotion="user"` handles it globally; for bespoke components use `useReducedMotion()`
and **gate the transition** (`duration: 0`), keeping the `m.div` in the tree so layout still resolves —
never wrap the whole component in a conditional that drops to a plain `<div>`.
