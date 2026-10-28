---
name: audit-performance
description: Audit a React app's front-end performance by MEASURING it, not just reading the code - real bundle size per route (next analyze on Next 16.4+, the build's First Load JS table on Next 15 and earlier), bundle composition, and Core Web Vitals (in dev, lab via Lighthouse on the production build - LCP/CLS/TBT; real-user field data incl. INP from PostHog/Vercel Speed Insights once deployed) - plus static checks for client/server boundary ('use client' overuse, heavy client libs), fetch waterfalls, asset & layout-shift (next/image, next/font, CLS), and streaming. Stack-adaptive (Next App/Pages Router, Vite/SPA, Remix). Reports a scored summary; pass --fix for safe low-risk fixes. Use whenever the user wants to audit/check/review performance, bundle size, Core Web Vitals (LCP/INP/CLS), slow loads, waterfalls, or rendering - even if they don't say "audit".
disable-model-invocation: true
argument-hint: "[--fix] [--bundle|--cwv|--boundary|--assets]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write, mcp__vercel__get_deployment_build_logs, mcp__vercel__get_runtime_errors, mcp__vercel__list_deployments, mcp__claude_ai_PostHog__exec
last_verified: 2026-10-21
---

# audit-performance

Audit a React app's front-end performance — **measure where possible, grep where not**. Build the
app to read real per-route bundle sizes, pull Core Web Vitals from field data, and statically scan for
the patterns that make pages heavy or sluggish. Report a **scored** summary. With `--fix`, apply only
mechanical low-risk fixes (`<img>`→`next/image`, await async params); boundary/data refactors are
report-only, and measurements are never auto-"fixed".

> When to use: "audit performance", "why is the bundle big", "check our Core Web Vitals / LCP / INP",
> "is the page slow", "check for waterfalls". Mirrors the `audit-database` report shape for
> `/full-audit`. Keep the template stable. Owns rendering/bundle/data-fetch perf + CWV; defers tokens
> to `audit-design-system`, skeletons + auth-flash/FOEC to `audit-loading-animations`, runtime console
> errors to `audit-console-logs` (this skill points at those, never silently drops them).

## Hybrid: static + measured

- **Static** (always): grep for the smells in `references/checks.md`.
- **Measured** (when the source/MCP is available): `npx next analyze --output` (or the SPA build output) for real bundle sizes, Lighthouse
  for lab CWV, PostHog/Vercel for field CWV + build logs. Missing source → `SKIPPED (<reason>)`.
  **Never fabricate a number or a score.** Always measure the **production build**, never dev.

## Modes

| Invocation | Behaviour |
|---|---|
| `/audit-performance` (default) | **Report only.** Static checks + measurements, score, output. |
| `/audit-performance --fix` | Report, then apply guarded fixes (`next/image`, await params). Ask before each. |
| `--fix --bundle` / `--cwv` / `--boundary` / `--assets` | Limit fixes to that dimension. |

`--fix` NEVER restructures the client/server boundary, rewrites fetching, changes caching, or edits
code to game a measurement.

## Procedure

1. **Detect the stack FIRST** (`references/checks.md` table). Next App Router enables the RSC-gated
   checks; Pages Router / Vite / Remix mark those `N/A` but still get bundle/CWV/asset/waterfall.
   Note whether React Compiler is on (changes the re-render verdict).
2. **Measure** (best-effort, read-only). Bundle: Next 16 prints no size columns; use
   `npx next analyze --output` (16.4+; `next experimental-analyze` on 16.1-16.3) or Lighthouse/field data. CWV in **dev** = lab: `npm run build && npm run start` then
   `npx lighthouse http://localhost:3000` (or `@lhci/cli autorun`) — **never `next dev`**; gives
   LCP/CLS/TBT, NOT INP. CWV **field** (real users incl. INP) = post-deploy only via PostHog
   `$web_vitals` / Vercel Speed Insights — `SKIPPED (post-deploy only)` during a dev audit. Deployed?
   also pull `get_deployment_build_logs` / `get_runtime_errors`. Mark each unavailable source
   `SKIPPED (<reason>)`.
3. **Static scan** the smells (PERF1c, PERF2, PERF3, PERF5, PERF6) by Grep, reading each flagged file
   to confirm (a waterfall must be a real dependency, not already parallel).
4. **Score** each dimension; gated checks are `N/A` off-Next or when React Compiler handles them.
5. **Output the report** (template below), including the per-route bundle table and CWV vs thresholds.
6. **If `--fix`:** apply guarded fixes, re-check, run `npm run build` + `type-check`. Report applied vs
   deferred.

## Scoring

Start each dimension at 100; subtract per finding (CRITICAL -40, HIGH -20, MEDIUM -10, LOW -3,
floor 0). Overall = weighted mean over **applicable** dimensions (renormalise when some are `N/A`).

| Dim | Weight | Covers |
|---|---|---|
| PERF1 Bundle size & weight (measured) | 22 | First Load JS per route (build), composition (analyzer), heavy client deps |
| PERF2 Client/server boundary (Next) | 20 | `'use client'` overuse, client-only dynamic import, re-render hygiene |
| PERF4 Core Web Vitals (measured) | 20 | LCP/INP/CLS/TTFB — field (PostHog/Vercel) first, lab (Lighthouse) fallback |
| PERF3 Data fetching & caching | 18 | fetch waterfalls (static + measured), TanStack `staleTime`, `force-dynamic` |
| PERF5 Asset & layout stability | 12 | `next/image`, CLS sources (dims, injected content), `next/font` |
| PERF6 Streaming & rendering (Next) | 8 | Suspense boundaries, awaited async params |

Weights sum to 100. Grade: A ≥90, B ≥80, C ≥70, D ≥60, F <60.

## Report template (keep stable - the audit pipeline parses this)

```
# Performance Audit - <project> - <grade> (<overall>/100)

Stack: <Next App|Pages | Vite | Remix>, React Compiler on/off    Measured: build ✓/SKIPPED, CWV field|lab|SKIPPED

| Dimension | Score | Findings |
|---|---|---|
| PERF1 Bundle size & weight    | NN | n |
| PERF2 Client/server boundary  | NN | n  (or N/A)
| PERF4 Core Web Vitals         | NN | n  (or N/A)
| PERF3 Data fetching & caching | NN | n |
| PERF5 Asset & layout stability| NN | n |
| PERF6 Streaming & rendering   | NN | n  (or N/A)

## Measured
Per-route First Load JS (warn >200kB, problem >300kB):
| Route | First Load JS | verdict |
| /dashboard | 412 kB | problem |
Core Web Vitals: LCP _ s · CLS _ · TBT _ ms · TTFB _ ms   [lab: Lighthouse on prod build | SKIPPED]
                 INP _ ms   [field only — PostHog/Vercel; SKIPPED in dev / pre-deploy]

## Findings
### [SEVERITY] <id> <title>   (check PERF1a)
- Where: <route | file:line>
- Evidence: <measured number | grep hit>
- Fix: <one line>  •  Auto-fixable: yes/no/guarded
- Applied: yes/no/deferred   (only in --fix mode)

## See also (not scored here)
- Auth flash / FOEC → run audit-loading-animations + audit-console-logs

## Skipped
- <measurements not run, and why>
```

## Rules

- **Measure the production build, and pick the source by context.** In **dev** (most audits here),
  lab — Lighthouse on `npm run build && npm start` — is the primary CWV signal and catches regressions
  pre-deploy; it gives LCP/CLS/TBT, **not INP**. **Field** data (CrUX/PostHog/Vercel, the only source
  of real INP and what Google ranks on) is **post-deploy only** — `SKIPPED` in a dev audit. Lab finds
  problems; field confirms fixes for real users (they differ 30-50% on interactivity).
- **No fabrication.** A measurement with no source is `SKIPPED`, never a guessed number/score.
- **Stack-adaptive.** Mark Next-only checks `N/A` off-Next; never throw RSC findings at a Vite app.
- **Confirm before flagging.** A waterfall must be a real dependency; an inline prop is only a finding
  when React Compiler is OFF. Read the file — don't flag on grep alone.
- Report-only is the default; auto-fix only the guarded checks. Never edit code to game a number.
- Prefer enabling **React Compiler** over hand-added `useMemo`/`useCallback` (project rule).
- Keep the report under ~600 lines; no raw build/Lighthouse dumps — surface the key numbers only.

## See also
- `references/checks.md` - probe + measurement catalogue (load when running)
- Siblings: `audit-loading-animations` (skeletons + auth flash/FOEC), `audit-console-logs` (live runtime),
  `audit-design-system` (tokens)
