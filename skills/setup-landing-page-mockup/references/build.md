# setup-landing-page-mockup - build patterns (the §8 sequence, in code)

Concrete, framework-neutral React/CSS patterns for the coded live-DOM hero mockup. All verified against
the vault guide + 2026 practice. Adapt to the project's stack and tokens - never hardcode hex, reuse the
shared UI primitives. Animate `transform`/`opacity` only.

---

## 1. Component shell + scroll-trigger

Self-contained, starts only when scrolled into view (not on load), pauses off-screen, and respects
reduced-motion.

```tsx
function HeroMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const reduced = usePrefersReducedMotion();      // matchMedia('(prefers-reduced-motion: reduce)')

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setPlaying(e.isIntersecting),        // play in view, pause out
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // reduced-motion: render the finished end-state frame, skip choreography
  if (reduced) return <div ref={ref}><MockFrame state="final" /></div>;

  return <div ref={ref}><MockFrame playing={playing} /></div>;
}
```

## 2. Staggered entrance (transform + opacity only)

```css
.mock-item {
  opacity: 1; transform: translateY(0);
  transition: opacity 320ms var(--ease-out), transform 320ms var(--ease-out);
  @starting-style { opacity: 0; transform: translateY(12px); }   /* animate first paint, no JS */
}
/* stagger related items 40-120ms; drive via inline --i on each child */
.mock-item { transition-delay: calc(var(--i) * 60ms); }
```

```css
:root { --ease-out: cubic-bezier(0.23, 1, 0.32, 1); }   /* strong UI ease-out; never bare ease-in/linear */
```

## 3. Simulated cursor - bezier glide OR teleport

Pin the cursor to the **target element's real geometry**, never hardcoded x/y (the documented churn
point - "the cursor missed the button"). Measure the target, move via `translate`, dip on "click."

```tsx
// glide (organic): animate translate along an eased path
cursorEl.animate(
  [{ transform: `translate(${from.x}px, ${from.y}px)` },
   { transform: `translate(${to.x}px, ${to.y}px)` }],
  { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }   // Apple-ish
);
// click dip at arrival:
cursorEl.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.9)' }, { transform: 'scale(1)' }],
  { duration: 140, easing: 'ease-out' });
```

- **Teleport** variant: skip the path animation - snap `translate` to the target, then dip. Maximises
  screen time on the resulting action; reads crisp/efficient.
- Make the click **actually do something** (reveal the next panel via frame/step-gated state) or cut the
  cursor entirely - a fake cursor over static UI reads as a cheap placeholder.

## 4. Character-jitter typing (the #1 believability detail)

Randomise the per-character delay 20-60ms. A fixed interval is the classic fake-demo tell. Vary the delay
deterministically-by-index if you must avoid `Math.random()` in SSR, or gate to client only.

```tsx
async function typeInto(setText: (s: string) => void, full: string, signal: AbortSignal) {
  let out = '';
  for (const ch of full) {
    if (signal.aborted) return;
    out += ch;
    setText(out);
    const jitter = 20 + Math.random() * 40;        // 20-60ms, never fixed
    await wait(jitter);
  }
}
```

- Counters/tickers: wrap digits in `font-variant-numeric: tabular-nums` so they don't reflow as they change.
- Keep a blinking caret; pause briefly at punctuation for extra realism.

## 5. Clean loop

Define an explicit reset so the seam is invisible - fade the whole widget `opacity` out/in, or reverse
the sequence - and keep total loop length reasonable (it shouldn't outstay attention). Abort in-flight
typing/cursor animations on reset (`AbortController`) so they don't overlap.

## 6. Reduced-motion + a11y

```css
@media (prefers-reduced-motion: reduce) {
  .mock-item, .mock-cursor { transition: opacity 200ms ease; transform: none; animation: none; }
}
```

- Show the **end-state** (typed text complete, panels populated) under reduced motion - not a blank frame.
- The whole widget is decorative: `aria-hidden="true"` on the animation layer, or a concise text
  alternative describing what the product does. Don't trap focus in a fake cursor.

## 7. Verify

- Screenshot the hero at 1440 + 390 (Playwright), compare against the reference/brand; iterate spacing.
- Scrub in DevTools Animations panel / slow-mo to catch timing and any accidental layout-property animation.
- Confirm: real DOM text (selectable, crisp), `transform`/`opacity` only, jittered typing, scroll-trigger,
  reduced-motion end-state.

---

## Tech-choice reminder

Coded live-DOM (this file) is the default for a product-UI mockup - real readable text. `--rive` only for
a character/mascot or genuinely interactive/stateful hero (~200KB WASM, ~60fps); `--lottie` only for a
designer-supplied decorative vector loop. Never rasterise the readable UI into either.
