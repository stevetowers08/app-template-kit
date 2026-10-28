# audit-design-system — check catalogue

The probes each check runs, what a finding looks like, and the fix. Checks are **static** - grep,
or a JSX-tree scan (`scripts/`) where the question is structural ("is this icon inside a Button?"
is not a grep question) - plus one optional **live** pass (DS·live) that measures the rendered page,
because classes can disagree with what renders. Keep this in sync with the global CLAUDE.md
"Design System Floor" + "UI Components (reuse-first)" rules and the project's `docs/design/`.

Contents: DS1 (tokens, ·icons) · DS2 (primitives, ·composition, ·coverage, ·surface, ·shape,
·cards, ·size-consistency, ·scroll) · DS3 · DS4 · DS5 · DS6 (·motion) · DS·live · auto-fix summary

First, **detect the shared UI dir and token source** (used by every check):
- Shared UI dir: `packages/ui/` (monorepo) or `src/components/ui/` / `components/ui/` (single app).
- Token source: Tailwind v4 `@theme` block in `app/globals.css` / `src/app/globals.css`, or
  `docs/design/tokens.css`. There is usually **no** `tailwind.config.ts` in v4 projects.
- Read `docs/design/design.md` + `components.md` if present — they are the project's contract and
  outrank generic advice.

If the shared UI dir can't be found, report DS2 as `SKIPPED (no shared UI dir found)` and note it.

---

## DS1. Token compliance (weight: high)

Colour / spacing / radius must come from tokens (CSS vars / Tailwind utilities), never hardcoded.
**Prefer a real Tailwind-v4-aware linter over grep** — it reads your `@theme` block so it knows your
actual token allowlist, with near-zero false positives and autofix.

### DS1·spine. Token linter (preferred over grep)
If the repo has one configured, or you can `npx` it, run a v4-aware token linter and use its output as
the primary DS1 result:
- **`oxlint-tailwindcss`** — rules `no-hardcoded-colors`, `no-arbitrary-value`, **`prefer-theme-tokens`**
  (auto-rewrites `bg-[var(--primary)]` → `bg-primary`). Reads `@theme` + shadcn vars via its CSS entry point.
- or **`eslint-plugin-tailwind-palette-guard`** — `no-palette-colors`, `no-inline-color-styles`;
  correctly **ignores** `*-[var(--x)]` / `hsl(var(--x))` token refs (no false positive on the bridge).
- **v4 gotcha — flag it:** a Tailwind **v3** linter (`eslint-plugin-tailwindcss@<4`, or any rule that
  reads `tailwind.config.js`) sees an *empty* config in v4, so its colour allowlist becomes the empty
  set and it silently **passes every off-token value**. If you detect that, report it as a HIGH finding
  and recommend a v4-aware linter — the project is effectively unlinted for tokens.
If no linter is available, fall back to the grep checks below and note `token linter not run` in the report.

### DS1a. Hardcoded hex / rgb / hsl colours (grep fallback)
Colour must come through the token bridge. In THIS project the bridge is `hsl(var(--token))`
(`bg-[hsl(var(--primary))]`, `text-[hsl(var(--ai))]`, `var(--landing-accent)`) — those are CORRECT,
**never flag them**. Flag only **literal** colour values:
```
# hex outside the token-defining files
grep -rnE '#[0-9a-fA-F]{3,8}\b' src --include=*.tsx --include=*.css \
  | grep -vE '(globals\.css|tokens\.css|@theme)'
# rgb()/hsl() with a NUMBER inside — i.e. a literal, NOT hsl(var(--x))
grep -rnE '\b(rgb|rgba|hsl|hsla)\(\s*[0-9.]' src --include=*.tsx
```
Allowed (the system working): `hsl(var(--x))`, `bg-[var(--token)]`, `var(--landing-serif)`.
Finding: `bg-[#3b82f6]`, `style={{color:'#fff'}}`, `hsl(220 14% 50%)`.
Fix: map to the nearest token. **Not auto-fixed** — choosing the right token is a judgement call;
report file:line + suggested token. (Verify the grep returns ~0 on this repo before trusting it — a
flood of `hsl(var(...))` hits means the pattern regressed.)

### DS1b. Arbitrary spacing / radius literals that duplicate a token
```
grep -rnE 'className="[^"]*\[[0-9]+px\]' src --include=*.tsx     # e.g. p-[13px], rounded-[7px]
```
Finding when a token exists for that value. Report; auto-fix only exact token matches under `--fix`.

### DS1·icons. Icon size scale (structural scan, then DS·live)
Icon sizes are a scale like any token. Two questions decide the findings and grep can answer
neither: is this icon inside a Button that forces its svg size, and how many sizes render per role.
```
node ~/.claude/skills/audit-design-system/scripts/icon-scan.mjs --root . [--scale 12,16,28] [--json out.json]
```
It reads the Button primitive to learn what it forces (`[&_svg]:size-4` unconditional, upstream's
`:not([class*='size-'])` form, per-size overrides), finds the icon library's global default, and
prints written sizes, off-scale sites, dead sizes inside Buttons and per-file counts. **Check its
COVERAGE line first**: it names icon-sized components from modules no rule recognised (a custom
set, a `*-icons` facade) - add them with `--icon-modules <regex>` before trusting any count.

Target (vault `Frontend/Components & Styling` -> "Icon sizes and treatments"): 16px for every icon
beside text, 12px only inside small containers, one larger step only for empty states, chrome
sizes set in primitives. Findings:
- **HIGH** - more than ~3 sizes in content, or the same role at different sizes (read the
  off-scale list by role: headings, row leads, field labels, chevrons, meta).
- **MEDIUM** - dead sizes inside Buttons: the source says 12 or 14, the page renders the
  Button's size. Removing them changes nothing visually and makes the code tell the truth.
- **MEDIUM** - the global default off the scale (a Phosphor `IconContext` at 18), or two providers
  with different defaults: every unsized icon under them renders off-scale.
- **MEDIUM** - mixed treatments in one role (plain vs circled vs tiled row icons).
- **LOW** - plain glyphs above 16px in content: more presence is a tile, not a bigger glyph.

Confirm with DS·live before reporting a size as rendered. Fix: report; the dead Button sizes are a
**guarded** auto-fix (zero visual change by construction - confirm, apply, re-run the scan). When
the class of finding has been fixed by hand before, propose the icon-sizes guard
(`references/guard-templates.md`).

---

## DS2. Primitive reuse (weight: high)

Never hand-roll a primitive (card, badge, button, input, dialog, list row) as a raw styled `<div>`.

```
grep -rnE '<div[^>]*className="[^"]*(rounded-[a-z0-9]+ )?(border )?bg-(card|background|muted)' src --include=*.tsx
grep -rnE '<(button|input|select|textarea)\b' src --include=*.tsx \
  | grep -vE 'components/ui/'                          # raw HTML form/button outside the UI primitives
```
A raw `<div className="rounded-* border bg-card ...">` that re-creates a Card, or a bare `<button>`
outside the shared UI dir, is a finding. Fix: replace with the shared primitive (`<Card>`, `<Button>`).
**Report only** (mechanical replacement risks losing props/handlers) — propose the swap.

If a needed primitive is missing from the shared UI dir, the fix is to ADD it there
(`npx shadcn add <name>`), never to inline a one-off. Flag as a `missing-primitive` finding.

### DS2·composition. shadcn composition rules (canonical hand-rolled → reuse)
shadcn publishes the exact mappings (`shadcn-ui/ui` → `skills/shadcn/rules/composition.md`). Flag each
hand-rolled pattern that a primitive already covers — this is the heart of "no hand-rolled components":

| Hand-rolled pattern | Use instead | grep signal |
|---|---|---|
| custom styled `<span>` used as a label/tag | `Badge` | `<span[^>]*className="[^"]*(rounded-full\|bg-(primary\|muted\|secondary))` |
| raw `<hr>` or a border-only divider `<div>` | `Separator` | `<hr\b` ; `<div[^>]*className="[^"]*(border-t\|border-b)[^"]*"\s*/?>` |
| loading placeholder `<div className="animate-pulse ...">` | `Skeleton` | `animate-pulse` outside `components/ui/skeleton` |
| `Card` with everything in `CardContent`, no `CardHeader` | full Card composition | read flagged `<Card>` usages |
| `Dialog`/`Sheet`/`Drawer` without a `*Title` | required title (a11y) | `<DialogContent\|<SheetContent\|<DrawerContent` lacking a `*Title` |
| `Avatar` without `AvatarFallback` | required fallback | `<Avatar>` lacking `AvatarFallback` |
| `<button>` with `isLoading`/`isPending` prop | compose `Spinner` + `disabled` | grep custom button props |
Report each as a `composition` finding; **report-only** (mechanical swaps risk losing props/handlers).

### DS2·coverage. Component Coverage Rate (report this MEASURED metric)
Governance benchmark (zeroheight/Nielsen Norman 2026): **target ≥ 80%** of UI built from design-system
primitives vs custom markup. Compute and report a real number:
```
PRIM=$(grep -rhoE "from ['\"]@/components/ui/" src --include=*.tsx | wc -l)   # primitive imports
RAW=$(grep -rnE '<(div|span|button)[^>]*className="[^"]*(rounded|border|bg-(card|background|muted|primary))' src --include=*.tsx | wc -l)
# coverage ≈ PRIM / (PRIM + RAW)
```
Report `Component Coverage Rate: NN%` + the worst-offending files. It's a **trend metric** (track drift
over time), not pass/fail — but <80% is a finding worth a HIGH note. AI-generated code is the top
drift source (it invents markup instead of reusing primitives), so this is the key guardrail.

### DS2·surface. Surface-token misuse (valid token, WRONG semantic surface) — HIGH
`bg-background` is the **page canvas**, never a content surface. The DS1 hex/arbitrary scans MISS these
because the classes are valid tokens — the bug is the wrong *semantic* surface, so the page colour
bleeds through and it breaks worse in dark mode. (Folded in from the old `design-system` command's most
valuable check.)
```
# elevated surface (card/panel/bordered box/table wrapper) painted with the page-canvas token
grep -rnE 'rounded-(md|lg|xl)[^"]*border[^"]*bg-background|bg-background[^"]*rounded-(md|lg|xl)[^"]*border' src --include=*.tsx | grep -viE 'border-input'
# bordered box / table wrapper with NO background (page bleeds through the cells)
grep -rnE 'border[^"]*rounded-(md|lg|xl)[^"]*overflow-hidden"' src --include=*.tsx | grep -viE 'bg-card|bg-popover|bg-muted'
# bg-white on a surface (breaks dark mode) not already paired with a dark: variant
grep -rnE 'bg-white(\s|")' src --include=*.tsx | grep -viE 'dark:'
```
Fix: content box/panel/table → `bg-card`; overlay (dropdown/tooltip/popover) → `bg-popover`; recessed
strip → `bg-muted`; `bg-white` surface → the matching theme token (flips in dark mode). Leave true page
roots (`min-h-screen ... bg-background`) and form inputs. Report.

### DS2·shape. Primitive shape duplication — HIGH
A component re-implements a primitive's *shape* (radius + background + border [+ shadow]) inline instead
of importing it. Web: caught by the DS2 main grep (`<div className="rounded border bg-card ...">`).
Mobile (RN/NativeWind): a `<View style={{ borderRadius, backgroundColor, borderWidth, borderColor }}>`
block that matches the `Card`/`Surface` signature — flag and propose `<Card bg borderColor>` (extend the
primitive first if it lacks the override props). Report (mechanical; never pass raw numbers to size/radius
props — use theme tokens or the primitive default).

### DS2·cards. Card types and shell drift (structural scan, then DS·live)
The outer shell (radius, border, surface) is usually already a token; drift hides in hand-built
copies of it, in call sites restyling the primitive, and in the card's anatomy.
```
node ~/.claude/skills/audit-design-system/scripts/card-scan.mjs --root . [--json out.json]
```
It finds the Card primitive (in the app or a monorepo `packages/ui`), counts card-like primitive
usage and call-site shell overrides, and groups every hand-built framed box by radius | border |
border colour | surface | shadow, with padding and tint-strength tallies. Target set (vault
`Frontend/Patterns/Cards & Tiles`): one shell; titled card, stat tile, callout, clickable /
selectable card, board card, inline empty state. Findings:
- **HIGH** - hand-built boxes copying the Card shell ("exact copies") - DS2·shape at scale.
- **HIGH** - card primitives restyled at the call site (radius/border/surface/shadow/padding in
  `className`): drift that passes every "is it a primitive" check.
- **MEDIUM** - framed boxes at the controls radius; more than two card paddings; tinted boxes
  outside the callout component at several strengths; titles above cards on some screens and
  inside on others (read screens or DS·live screenshots); a card nested in a card.
- **LOW** - surfaces on `bg-white` or with no background (cross-ref DS2·surface).
- **MEDIUM (review, from DS·live screenshots)** - card contents: lists in different cards with
  different row shapes; key-value facts laid out three ways (label-left rows, stacked grid, prose);
  "nothing here yet" as bare text in one card and an empty state in another; two differently
  shaped blocks in one card body; the same row action repeated on every row instead of one header
  action. Content types and anatomy: vault `Frontend/Patterns/Cards & Tiles` -> "What goes inside".

"Framed box" counts over-count (hand-built popover panels, code blocks, image frames): lead with
the exact-copy and override counts, treat the rest as a shortlist. Report only - swaps need
judgement. Propose the card-shells guard (`references/guard-templates.md`).

### DS2·size-consistency. Size-variant drift (ad hoc `size=` per call site) — MEDIUM
A primitive can be correctly reused (passes the main DS2 grep) but still drift because every call site
picks its own `size=` value with no shared convention — e.g. a 50/50 split of `sm` vs default height
across otherwise-equivalent standalone buttons, so two controls in the same toolbar differ by a few px
for no reason. This is invisible to DS2·coverage (both are "real" primitive imports) so it needs its own
check.
```
# distinct size= values used per file, for Button/Select trigger call sites (not their definitions)
grep -rnoE '<(Button|SelectTrigger)\b[^>]*\bsize=(\{?["'"'"']?[a-zA-Z-]+)' src --include=*.tsx \
  | grep -vE '/components/ui/|/packages/ui/'
# files where >1 distinct size value appears for the same component, outside a .map(/list-render context
```
Report **per file**: which distinct sizes are mixed (e.g. `sm, default`) and whether the file contains a
list-render context (`.map(`, table row) — a genuine dense-context split (table-row actions = `sm`/`xs`,
standalone toolbar/CTA = `default`) is **not** a finding; an ad hoc mix with no context justification is.
Cross-reference `docs/design/components.md` if it documents a size convention (e.g. "default = standalone,
sm = dense contexts, xs/icon-* = compact toolbars/table rows") — score against that contract if present,
otherwise flag only the *presence* of unexplained drift and let the user judge per call site (this needs
human judgement, same as DS2 composition swaps).
Fix: **never mutate the shared component's existing `sm`/`default`/`lg` CVA values** — shadcn composite
components (Calendar, Combobox, etc.) import `buttonVariants` internally and depend on those exact
values; add a new named size instead if a genuinely new in-between size is needed. Prefer shadcn's own
`xs` tier for dense toolbars/table-row actions before inventing a custom token. Report only — mechanical
detection, but which size is "correct" per call site is a judgement call, so never auto-fix.

### DS2·scroll. Scroll ownership + hand-rolled page frames — HIGH
The page-level counterpart to DS2·shape: instead of re-implementing a *card*, a page re-implements the
*frame* (header + scrolling body + footer) out of raw flex. `position: sticky` sticks to the nearest
scrolling or clipping ancestor, **not the viewport**, so once "which element scrolls" is implicit it
drifts per page — and the symptom lands somewhere other than the page that caused it. One root cause,
four recurring bugs: sticky that will not stick, two scrollbars, content not filling the width, header
misaligned with content.
```
# 1. How many scroll containers exist outside the shared UI dir (the count IS the finding)
grep -rn "overflow-y-auto\|overflow-auto\|overflow-y-scroll" app src --include=*.tsx \
  | grep -vE '/components/ui/|/packages/ui/' | wc -l
# 2a. Does a SCROLL-OWNING primitive exist? (a PageHeader is NOT one - see 2b)
grep -rlE "export (default )?(function|const) (AppShell|PageBody|PageLayout|Page)\b" app src --include=*.tsx
# 2b. Header / width primitives (partial credit - the frame's top half only)
grep -rlE "export (default )?(function|const) (PageHeader|PageTitle)\b" app src --include=*.tsx
# 3. Files that own scroll AND pin something sticky = a hand-rolled page frame
grep -rlE "overflow-(y-)?(auto|scroll)" app src --include=*.tsx \
  | grep -vE '/components/ui/|/packages/ui/' \
  | xargs grep -lE "\bsticky\b.*\b(top|bottom)-|\b(top|bottom)-.*\bsticky\b" 2>/dev/null
# 4. Does the contract even state an owner?
grep -inE "scroll owner|scroll ownership|owns scroll" docs/design/*.md
```
Findings, by severity:
- **HIGH** — scroll containers in the dozens (probe 1) with no scroll-owning primitive (probe 2a) and
  no stated owner (probe 4): there is no owner, only candidates. Recommend the minimum set — `AppShell`
  (required `scroll` prop, **no default**, so every caller must state which thing scrolls), `Page`,
  `PageHeader`, `Stack`/`Inline`. **A `PageHeader` existing (probe 2b) does not clear this** and is the
  easiest false negative here: a repo can render one on every page and still have no answer to which
  element scrolls. Score 2a and 2b separately.
- **MEDIUM** — each file from probe 3 that is not a documented deliberate second owner (split view,
  chat pane, virtualised table). A deliberate one is fine; an undocumented one is the bug.
- **MEDIUM** — `docs/design/design.md` documents header height and gutters but has no
  **Layout & scroll ownership** section (probe 4 empty). That absence is what lets every page
  improvise. Fix: regenerate via `/setup-design-system`.
- **LOW** — page width/gutter set by ad hoc classes per page rather than one helper or primitive.

Report only — never auto-fix. Migrating call sites is a judgement call and usually a scheduled piece of
work, not a side effect of an audit. Cross-project rule + primitive set:
`Frontend/Layout & IA/Page Layout Primitives & App Shell Architecture` in the vault. Note for 2026:
Chrome ships `container-type: scroll-state` + `@container scroll-state(stuck: top)`, which replaces the
JS-scroll-listener / IntersectionObserver-sentinel hack for styling a stuck header.

## DS3. Inline styles (weight: medium)

Inline `style` only for dynamic per-entity values or CSS vars not mapped to Tailwind.
```
grep -rnE 'style=\{\{' src --include=*.tsx
```
A static `style={{ padding: 16 }}` is a finding (use a utility). A dynamic
`style={{ width: `${pct}%` }}` or `style={{ '--x': value }}` is allowed. Report; manual fix.

## DS4. Accessibility + WCAG contrast (weight: high)

```
grep -rnE '<img\b(?![^>]*\balt=)' src --include=*.tsx                 # img without alt
grep -rnE 'onClick=' src --include=*.tsx | grep -E '<div|<span'        # click handler on non-interactive
grep -rniE 'outline-none|focus:outline-none' src --include=*.tsx        # killed focus ring w/o focus-visible
```
- `<img>` without `alt`, click handlers on `<div>`/`<span>` without `role`+keyboard, `outline-none`
  without a `focus-visible` replacement → findings (auto-fixable: add `alt=""`/focus-visible rings).

**WCAG 2.2 AA contrast thresholds:** text **4.5:1**, large text (≥18.66px / 14px-bold) **3:1**,
**non-text UI components + borders 3:1** (newer 2.2 criterion), AAA 7:1.

- **Authoritative method = axe-core against the rendered DOM** (`@axe-core/playwright`). It computes
  real contrast from the actual painted colours and also catches labels, alt, ARIA, headings/landmarks,
  and the WCAG 2.2 **target-size** rule. It is **LIVE**, so the run belongs in `audit-console-logs`
  (already live Playwright) or an explicit `npx @axe-core/playwright` pass with tags
  `['wcag2a','wcag2aa','wcag21aa','wcag22aa']` — report `SKIPPED (no live a11y run)` here and point there.
- **Static approximation (dev, no browser):** resolve the token PAIRS from `globals.css`
  (`--foreground` on `--background`, `--primary-foreground` on `--primary`, etc.) and compute the
  WCAG2 ratio; flag any pair < 4.5:1 (text) / < 3:1 (large + non-text). Pairs you can't resolve =
  `manual review`, never a guessed ratio.
- **APCA** (Advanced Perceptual Contrast Algorithm, CSS Color 4 candidate) is a stricter perceptual
  sanity check — better for small text — but **WCAG 2.2 is the legal/compliance bar**; treat APCA as
  supplementary, not the gate.

## DS5. Design docs floor (weight: medium)

Every project must have `docs/design/design.md` + `docs/design/components.md`. Product-facing apps
also need `docs/design/personas.md`, `voice.md`, and `tokens.css` (when a CSS token bridge exists).
```
# case-insensitive — this project uses UPPERCASE (DESIGN.md, COMPONENTS.md); accept the repo's casing
for f in design components; do
  ls docs/design/ 2>/dev/null | grep -iqE "^$f\.md$" || echo "MISSING docs/design/$f.md (any case)"
done
```
Missing files = findings. Accept whatever casing the repo uses (don't flag `DESIGN.md` as missing
`design.md`); only flag true absence. Fix: scaffold via `/setup-new-repo` then `/design-system`.
Report only (don't auto-generate design docs — they need real content).

## DS6. Library + config hygiene (weight: low)

- No competing UI libs alongside the chosen system:
```
grep -rnE "from ['\"]@(mui|chakra-ui|mantine/core|ant)" src --include=*.tsx
```
  (Exception per project rules: `@mantine/core` is allowed **only** inside BlockNote.)
- `cn()` from the project util used for conditional classes, not raw `clsx`:
```
grep -rn "from 'clsx'" src --include=*.tsx ; grep -rn 'classnames' src --include=*.tsx
```
- shadcn primitives in the UI dir not modified by hand (check git/comments) — advisory.
Findings: a competing UI lib in app code, raw `clsx` where `cn()` exists. Report; the `clsx`→`cn`
swap is auto-fixable under `--fix`.

### DS6·motion. Motion system compliance (verified Motion 14.5)
Motion is a design-system concern - check it when the app animates (`/setup-motion` is the generator).
```
grep -rn "from ['\"]framer-motion['\"]" src       # legacy — should be motion/react
grep -rlnE "from ['\"]motion/react(-client)?['\"]" src | xargs grep -lE "\bmotion\.[a-z]" 2>/dev/null  # full `motion` not `m`+LazyMotion (bundle)
grep -rlnE "animate=|whileInView=|transition=|animate-" src | xargs grep -Ln "useReducedMotion\|reducedMotion\|motion-reduce\|prefers-reduced-motion" 2>/dev/null  # motion without reduced-motion
```
Findings: `framer-motion` import (legacy → `motion/react`); full `motion.*` instead of `m`+`LazyMotion`
(~43kb vs ~5kb); animation with no reduced-motion guard (a11y - cross-ref DS4); motion magic-numbers
instead of motion tokens (cross-ref DS1). Report. Reduced-motion absence is the HIGH one (a material
share of users enable OS Reduce Motion).

---

## DS·live. Live surface pass (optional; preferred for DS1·icons and DS2·cards)

Measures what renders - dead classes, a context default and parent-forced sizes all make a
static read disagree with the page.
```
MSYS_NO_PATHCONV=1 node ~/.claude/skills/audit-design-system/scripts/measure-live.mjs --root . \
  --base http://localhost:3000 --paths "/,/<list>,/<record>/<real-id>" --tabs --scale 12,16,28 \
  --env-file .env.local        # or --storage-state <playwright state file>
```
- **Auth: a test account only** - the repo's e2e user from its env file (`--email-var` /
  `--password-var`, default `E2E_USER_EMAIL` / `E2E_USER_PASSWORD`) or a Playwright storage state.
  Never type or ask for a person's credentials, never print env values, and never bypass a
  browser launcher that refuses to start because a profile holds saved passwords.
- The script fails loudly if a login form is still showing, so it cannot measure a login page
  by mistake. Repeated logins can hit the auth rate limit - measure every path in one run.
- Pass **real** record URLs and `--tabs` to click every tab. Test data is sparse, so the static
  scans still cover states the live pass cannot reach.
- Git Bash rewrites arguments starting with `/` - prefix `MSYS_NO_PATHCONV=1` (the script refuses
  a rewritten path rather than opening the wrong page).
- Output per view: icon size histogram (content vs app bar/rail), off-scale content icons, card
  computed-style signatures (transparent shadows normalised to none), full-page screenshots, and
  `measure.json`. Read the screenshots for title placement and treatments.

Report `DS·live: run (N views) | SKIPPED (no dev server | no test login)`.

---

## Auto-fix summary

| Check | Auto-fix? |
|---|---|
| DS1a hardcoded colour | No (suggest token) |
| DS1b spacing/radius literal | Exact-match only |
| DS1·icons dead size inside a Button | Guarded (zero visual change; confirm, apply, re-scan) |
| DS1·icons off-scale / role drift | No (report; which step a role takes is judgement) |
| DS2·cards hand-built shell / restyled primitive | No (propose swap + guard) |
| DS2 hand-rolled primitive | No (propose swap) |
| DS2 size-variant drift | No (report only, needs judgement) |
| DS2 scroll ownership / page frame | No (report only, migration is scheduled work) |
| DS3 static inline style | No |
| DS4 missing alt / focus-visible | Yes (`--a11y`) |
| DS4 contrast | No (manual review) |
| DS5 missing design docs | No (scaffold via skill) |
| DS6 clsx→cn | Yes |
| DS6 competing UI lib | No (report) |
