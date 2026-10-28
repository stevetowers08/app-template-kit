# audit-frontend-design - FD1-FD7 critique catalogue

Read the actual screenshots and grade each probe. A finding is CRITICAL/HIGH only if it is visible in a
shot you captured. Severity guide: CRITICAL -40 (breaks the page's job), HIGH -20 (clearly cheapens it),
MEDIUM -10 (noticeable), LOW -3 (nitpick). Every dimension: also note what it does *well*.

---

## FD1 - Visual hierarchy (weight 20%)

| id | Probe | Fail looks like |
|---|---|---|
| FD1a | Is there ONE clear entry point per view? | Eye has nowhere to land; 3+ elements fight for first read |
| FD1b | Does size/weight/colour/space encode importance? | H1 and body same weight; primary CTA same as secondary |
| FD1c | Is the primary action unmistakable? | Two equally-weighted buttons; ghost CTA next to a filled nothing |
| FD1d | Reading order matches importance order? | Biggest thing on the page is decorative, not the message |
| FD1e | Section headers separate from body? | Flat wall of same-size text |

## FD2 - Typography (weight 18%)

| id | Probe | Fail looks like |
|---|---|---|
| FD2a | Sizes come from a scale (not arbitrary)? | 15px / 17px / 19px drift; too many distinct sizes |
| FD2b | Body line length ~45-75ch? | Full-width paragraphs spanning 1200px; or a cramped 20ch column |
| FD2c | Line-height + paragraph rhythm readable? | Tight leading on long text; headings crammed against body |
| FD2d | Weight contrast between levels? | Everything 400; or everything bold |
| FD2e | No orphans/widows/awkward wraps in headings? | One word alone on a hero H1's second line |
| FD2f | One or two families, used with intent? | 3+ typefaces; display font used for body |

## FD3 - Spacing & alignment rhythm (weight 16%)

| id | Probe | Fail looks like |
|---|---|---|
| FD3a | Consistent spacing scale (4/8-based)? | 13px here, 21px there - one-off gaps |
| FD3b | Edges + baselines aligned? | Cards start at different x; labels not baseline-aligned to inputs |
| FD3c | Even gutters in grids/rows? | Uneven column gaps; ragged card heights |
| FD3d | Proximity groups related items? | Label far from its field; unrelated blocks equidistant |
| FD3e | Consistent padding inside like containers? | Cards with different internal padding side by side |

## FD4 - Composition & whitespace (weight 14%)

| id | Probe | Fail looks like |
|---|---|---|
| FD4a | Deliberate whitespace (breathing room, not accidental sparseness)? | Cramped edges; or vast empty voids with tiny centred content |
| FD4b | Visual balance across the viewport? | Everything jammed left; heavy top, empty bottom |
| FD4c | Clear underlying grid? | Elements at arbitrary x positions, no columns |
| FD4d | Gestalt grouping (common region / proximity)? | Cards without boundaries bleed together; can't tell groups apart |
| FD4e | Section-to-section rhythm on long pages? | Every section same height/pattern; or jarring density jumps |

## FD5 - Colour & contrast, perceptual (weight 12%)

| id | Probe | Fail looks like |
|---|---|---|
| FD5a | Accent restrained (one accent, reserved for attention)? | Gradient-soaked; every element a different bright colour |
| FD5b | Brand palette from `docs/design` honoured? | Off-brand blues/purples the design docs never define |
| FD5c | Figure/ground separation clear? | Cards same colour as page bg with no border/shadow; text on busy image |
| FD5d | Contrast reads at a glance (perceptual - defer axe)? | Grey-on-grey secondary text you have to squint at |
| FD5e | Dark mode (if present) stepped by surface lightness, not just inverted? | Pure-black cards; shadows invisible on dark |

> Authoritative WCAG ratios come from `audit-console-logs` (axe-core live). Here, flag only what is
> *visibly* low-contrast in the screenshot; never state a computed ratio you didn't measure.

## FD6 - Motion & interaction feel (weight 12%)

Load the motion guide first: `Wiki/Growth & Marketing/Landing Pages/Landing Page Visual & Motion Design Guide`.
Screenshots can't show motion - inspect the transition/animation CSS and motion-lib code, and if the app
is live, trigger a few interactions and observe.

| id | Probe | Fail looks like |
|---|---|---|
| FD6a | Entrances/exits use ease-out or a strong custom cubic-bezier (never a bare `ease-in`/`linear` on UI)? | `transition: all 0.2s linear`; a bare `ease-in` on a UI transition |
| FD6b | Durations 150-500ms (micro 150-300, standard 200-400, complex ≤800)? | 1s+ UI transitions; or 0ms snaps where a fade was meant |
| FD6c | Animates ONLY transform + opacity? | Animating width/left/top/margin/height (layout jank) |
| FD6d | Related elements staggered 40-120ms, not all-at-once? | Whole grid pops in simultaneously |
| FD6e | `prefers-reduced-motion` respected (fade, not crude disable)? | No reduced-motion handling anywhere |
| FD6f | Hero/complex anim triggered on scroll-into-view, not autoplay on load? | Everything animates on first paint, janks the load |
| FD6g | Typing/chat effects use randomized 20-60ms jitter, not fixed interval? | Uniform `setInterval` typing (the classic fake-demo tell) |
| FD6h | `transition: all` avoided in favour of specific properties? | Blanket `all` transitions triggering paint on hover |

## FD7 - Anti-slop / intentionality (weight 8%)

| id | Probe | Fail looks like |
|---|---|---|
| FD7a | Not the generic AI-default layout? | Centred hero + subtitle + 2 buttons + 3 identical feature cards + emoji bullets |
| FD7b | Distinctive, deliberate choices somewhere? | Zero personality; indistinguishable from a template |
| FD7c | Consistent voice across surfaces? | Playful landing, sterile app - or vice versa, with no bridge |
| FD7d | Detail polish (icon alignment, corner radii, hover states, empty states)? | Mismatched radii; default browser focus rings; blank empty states |
| FD7e | No "Powered by AI" badge-shouting / dated trend cruft? | Gratuitous AI badges, 2019 neumorphism, unpurposed glassmorphism |

---

## Scoring worked example

FD1 with one HIGH (no focal point on the dashboard, -20) and one MEDIUM (secondary CTA competes, -10)
= 100 - 30 = **70**. Overall = weighted mean across FD1-FD7. Grade bands: A ≥90, B ≥80, C ≥70, D ≥60,
F <60. Keep findings ranked most-severe first within each dimension.
