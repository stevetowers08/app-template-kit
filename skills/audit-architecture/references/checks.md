# audit-architecture — check catalogue

Static checks for **code/folder structure** of a React app. **Stack-adaptive:** a **Next.js 16 (App
Router)** app, or a **React + Vite SPA** (routes via react-router in `src/`, no `app/` dir). Each check
notes its stack; Next-only mechanics are marked and become `N/A` on a Vite SPA, which runs the `src/`
equivalent. Verified against the official Next.js Project Structure docs, the 2026 App-Router
consensus, and standard Vite/React SPA `src/` conventions.

## The target is the SETUP skills + the project's declared layout

Architecture is **project-declared**, not generic. Read, in priority order:
1. **The project's `AGENTS.md` "Project layout" / "Structure" section** — this is the declared target; it
   WINS over generic best practice. (one production app declares: `app/` routes, `src/components/`,
   `src/features/` slices, `src/hooks/`, `src/integrations/supabase/`, `src/lib/` pure utils.)
2. **What `/setup-new-repo` scaffolds** + per-directory `CLAUDE.md` conventions (the structural standard).
3. Generic Next.js 2026 best practice (below) only fills gaps the project hasn't declared.

Flag a file as misplaced only if it violates the *declared* layout, not merely a generic ideal. If
`AGENTS.md` has no layout section, recommend running `/setup-new-repo` and audit against the standard.

Scope boundaries: docs/ + AGENTS.md/CLAUDE.md structure → **`audit-documentation`**; `components/ui`
primitive reuse + tokens → **`audit-design-system`**; `'use client'` *performance* → **`audit-performance`**
(here we check structural *placement*, not the perf verdict).

## Contents
ARCH1 route/page purity · ARCH2 components organisation · ARCH3 lib + dependency direction ·
ARCH4 client/server placement & barrels · ARCH5 routing & conventions

---

## ARCH1. route/page purity — routes only (weight: 25)

Route entry points are **thin orchestration** - no business logic or reusable components dumped in them.

**Next (`app/` purity):** house convention (AGENTS.md), not a framework rule: colocation in `app/` is safe
by default because only `page`/`route` files are routable. The convention keeps `app/` to routing files only: `page`, `layout`,
`loading`, `error`, `not-found`, `template`, `default`, `global-error`, `global-not-found`, `forbidden`,
`unauthorized`, `route`, plus route groups `(group)` and private folders `_components`/`_lib`.
```
# non-routing component files directly in app/ outside a _private folder
find app -name '*.tsx' | grep -vE '/(page|layout|loading|error|not-found|template|default|global-error|global-not-found|forbidden|unauthorized)\.tsx$' | grep -vE '/_'
# fat route files (heavy logic in a page/route instead of _lib/services)
```
A `app/dashboard/components/Chart.tsx` (non-underscore) is a finding - either a private `_components/`
(route-local) or move to `src/components/` (shared).

**Vite SPA equivalent (N/A the `app/` grep):** route components live in `src/pages/` (or `src/routes/`)
and are wired in the react-router tree. They should delegate to `features/`/`hooks/`/`lib` - flag a
page file carrying heavy data-munging or business logic, or shared (non-page) components defined inside
`src/pages/` that belong in `src/components/` or `src/features/`.
```
# heavy/fat page components (rough size signal — read before flagging)
find src/pages src/routes -name '*.tsx' 2>/dev/null | xargs wc -l 2>/dev/null | sort -rn | head
# shared components defined under pages/ instead of components/features
find src/pages -name '*.tsx' 2>/dev/null | grep -iE '/(components|ui)/'
```
Fix: relocate per the declared layout. Report.

## ARCH2. components/ organisation (weight: 20)

Three tiers, not a flat dump: **`ui/`** (primitives - shadcn/design-system, no domain logic),
**`features/`** (domain-aware slices - the project's convention), **`layout/`** (Header/Footer/Sidebar).
```
ls src/components/ui >/dev/null 2>&1 || echo "no components/ui tier"
N=$(find src/components -maxdepth 1 -name '*.tsx' | wc -l); [ "$N" -gt 20 ] && echo "flat components/ dir: $N files at top level (tier them)"
```
A flat `components/` with 30+ files at the top level is a finding (un-navigable). Domain components
belong in `src/features/<domain>/` (project) or `components/features/`. **Defer** primitive-reuse and
token checks to `audit-design-system`. Report organisation gaps only.

## ARCH3. lib/ + dependency direction (weight: 25)

The dependency graph flows ONE way: **routes → components → lib** (Next: `app/` is the route tier;
Vite: `src/pages`/`src/routes`). `lib/` is shared non-component code (pure utils, Zod schemas, clients,
and on Next, Server Actions) - **no React/JSX**, and it must NOT import from `components/`, `pages/`, or
`app/`.
```
# lib importing UP the graph (wrong direction) — covers both app/ (Next) and pages/ (Vite)
grep -rnE "from ['\"]@/(components|app|pages|routes|features)/" src/lib
# React/JSX leaking into lib (lib should be pure)
grep -rlnE "from ['\"]react['\"]|\.tsx$" src/lib 2>/dev/null
# lib/utils.ts junk drawer (split when it grows past ~5-10 funcs)
[ -f src/lib/utils.ts ] && echo "utils.ts fn count: $(grep -cE 'export (const|function)' src/lib/utils.ts)"
```
Findings: `lib` importing from `components`/`app` (HIGH - inverted dependency); React in `lib`;
`lib/utils.ts` as a junk drawer (split into `lib/date.ts`, `lib/currency.ts`, …). Report.

## ARCH4. Client/server placement & barrels (weight: 15)

**Barrel files (both stacks):**
```
# barrel files (index.ts re-exports) — kill tree-shaking + (on Next) cause accidental client bundling
find src -name 'index.ts' | xargs grep -lE "export \*|export \{" 2>/dev/null
```
Barrel-file overuse is a finding on either stack (use sparingly, only for a real public API surface).

**Next directive hygiene (N/A on a Vite SPA — everything is client, no `'use server'`):**
```
# a single file mixing 'use client' and 'use server'
grep -rlE "'use client'" src app | xargs grep -lE "'use server'" 2>/dev/null
```
Findings: hooks/stores not kept client-side; a file mixing both directives (split it). On a Vite SPA
skip the directive checks entirely. Report.

## ARCH5. Routing & conventions (weight: 15)

```
# Next: both routers present (split-brain) — N/A on a Vite SPA
[ -d app ] && [ -d pages ] && echo "BOTH app/ and pages/ — split-brain router"
# path alias configured (both stacks) — tsconfig, plus Vite resolve.alias must match
grep -q '"@/\*"' tsconfig.json || echo "no @/* path alias in tsconfig"
grep -qE "resolve:\s*\{[^}]*alias|alias:" vite.config.* 2>/dev/null || true   # Vite: alias must mirror tsconfig
```
- **Next:** route groups `(group)` to organise without URL change; private `_folders` for route-local
  code; one router (no `app/`+`pages/` split-brain).
- **Vite SPA:** a single react-router tree (routes centralised, not scattered/duplicated); the `@/`
  alias in `tsconfig.json` and `vite.config` `resolve.alias` must agree (a mismatch builds in one tool
  and breaks in the other).
- `src/` used consistently (don't split app code half in `src/`, half at root).
- `@/` path alias present and used (not deep `../../../` relative chains).
Report. (Per-directory `CLAUDE.md` presence is `audit-documentation`, not here.)

---

## Auto-fix summary
| Check | Auto-fix? |
|---|---|
| everything | No — moving files changes imports across the tree; **report + propose** the relocation, apply only under `--fix` with explicit confirmation (and fix inbound imports in the same change). |
