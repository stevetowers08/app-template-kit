---
name: audit-page-loading
description: "Audit how every page of a React / Next.js app loads and responds - the loading sequence route by route (what paints first, what waits on what, server and client request waterfalls, Suspense placement, the app shell and sidebar), plus click responsiveness (INP), layout shift (CLS), loading-state smoothness, Vercel platform settings and whether React/Next are current. Field data first, then a per-route code trace, graded against the vault's Performance Audit Checklist, refreshed via /research when stale. Use this whenever someone says a page feels slow, laggy, janky or not smooth, asks to check waterfalls, the loading sequence or loading on each page, asks why LCP/INP/CLS is high, says the sidebar or header loads late, or wants a loading/performance review before a launch - even if they never say 'audit'."
argument-hint: "[route | --top N | --shell-only]"
allowed-tools: Read, Grep, Glob, Bash, Skill, Agent, Write
last_verified: 2026-10-24
---

# audit-page-loading

Answer one question per page: **in what order does this page appear, what makes the user wait, and
does it feel smooth?** The output is a ranked list of measured problems, each traced to the line of
code that causes it, with the fix shape.

This skill is the procedure. The checks themselves live in one place, the vault note
`<knowledge-base>/Frontend/Next.js/Next.js Rendering Performance.md`, section
"Performance Audit Checklist" (steps 1-10). Read that section at the start of every run and grade
against it; do not work from memory of it, because it is kept current and this file is not.

Siblings, for depth this skill does not repeat:
- `audit-performance` - scored bundle-size and code-smell audit (First Load JS per route).
- `audit-loading-animations` - implementing or fixing skeletons, spinners and auth-flash (FOEC).
- `vercel-optimize` - Vercel cost and function-usage optimisation.

Arguments: a route (`/settings`) audits that route plus the shell; `--top N` sets how many routes
by traffic (default 8); `--shell-only` traces only the shell (layouts, providers, sidebar, header).
Steps 1, 2 and 5 run in every mode.

## Ground rules

- **Read-only.** Report; change code only if the user asks after seeing the report.
- **Never start a dev server** and never quote a dev-server number as a load time. Dev compiles on
  demand and gets slower the more you measure it. Lab numbers come from a production build or the
  deployed URL only.
- **No number without a source.** Every figure names where it came from (PostHog, Speed Insights,
  CrUX, Lighthouse on prod). Missing source = `SKIPPED (<reason>)`, never an estimate.
- **The repo's own rules outrank this skill.** If the repo has a rendering/performance contract, a
  vitals script or a perf baseline script (look in `AGENTS.md`, `CLAUDE.md`, `docs/contracts/`,
  `package.json` scripts), use its instruments and grade against its stated target shape too.
- **Shared working tree.** Another session may be editing. Read, never stash, checkout or reformat.
- **Times** reported to the user are UTC+8.

## Step 0 - Orient (5 minutes, not more)

1. Detect the stack: framework and router (`next.config.*`, `app/` vs `pages/`), React Compiler on or
   off, data library (TanStack Query, SWR, RSC only), hosting (`vercel.json`, `.vercel/project.json`).
2. Find the repo's performance instruments: `npm run` scripts mentioning vitals, perf, analyze,
   lighthouse; a web-vitals reporter component (`grep -rl "web-vitals\|onLCP\|useReportWebVitals"`).
3. Read the repo's rendering contract if one exists, and the vault orientation the global CLAUDE.md
   asks for (`Apps/<name>/README.md`).

## Step 1 - Freshness: checklist and versions

1. Read the vault checklist section. Note its `updated:` frontmatter date and the date in
   "10. Versions (checked YYYY-MM-DD)".
2. Check versions against npm:
   ```bash
   npm view next version; npm view react version; npm view web-vitals version
   node -e "const l=require('./package-lock.json');for(const k of ['node_modules/next','node_modules/react','node_modules/react-dom'])console.log(k,l.packages[k]?.version)"
   ```
   (pnpm/yarn: read their lockfile instead.) Next's App Router runs the React build vendored inside
   `next`, so the app's effective React is set by the `next` version; the top-level `react` package
   matters for Pages Router, tests and tooling.
3. **Run `/research` when any of these is true**: the versions section is older than 30 days; npm
   `latest` for `next` or `react` is a newer minor than the note lists; or the app uses a feature the
   checklist does not cover. Scope the research to the delta, e.g. "Next.js 16.4.3 -> 16.5.0 changes
   affecting loading performance, and whether the vault Performance Audit Checklist is still
   current". `/research` updates the vault note itself; re-read the section afterwards.
4. Record: installed vs latest, any security advisory that applies, any pin the repo holds (a pin is
   a decision, not drift; report it, do not recommend breaking it without its reason).

## Step 2 - Field data first

Field P75 per route from real users is the verdict; everything later explains it. Source order and
copy-paste queries: `references/field-data.md`.

1. Get P75 LCP, INP, CLS, FCP, TTFB per route, **with the sample count `n`**, over 30 days. `n` is the
   traffic ranking: audit in that order. Mark anything with n < 10 as low-confidence.
2. Decompose. The breakdown, not the P75, picks the fix:

   | Largest part | Means | Look at |
   |---|---|---|
   | LCP `ttfb` | server slow | step 3 server waterfalls, region, auth per request |
   | LCP `load_delay` | LCP resource found late | image discovery, preload, CSS/JS before it |
   | LCP `load_dur` | resource big or slow | image size, `sizes`, CDN |
   | LCP `render_delay` | downloaded but not painted | shell not in first HTML, hydration, JS, data |
   | INP `input_delay` | main thread busy before handler | long tasks during/after load, hydration |
   | INP `processing` | handler or React render heavy | re-render scope, transitions, list size |
   | INP `presentation` | too much DOM/layout after | DOM size, virtualisation, layout thrash |
   | CLS `after_load` high | shift after load = refetch or late insert | the named element |

3. **Read the LCP element selector.** If it is text chrome (a nav item, a header button, a heading)
   with a multi-second render delay, the shell is not in the first HTML flush. Text paints at first
   parse unless something keeps it out: that becomes the first thing step 3 traces.
4. If the app has no field data: say so, recommend adding a `web-vitals/attribution` reporter
   (`references/field-data.md` has the minimal one), and fall back to Lighthouse on the deployed
   URL or `build && start`. A lab run never reports INP.

## Step 3 - Trace the loading sequence, shell first, then each route

Trace the **shell first** (root layout, route-group layouts, providers, sidebar/nav, header,
toolbars): every route pays for it, so one shell defect explains many slow routes at once. Then the top
routes by `n` (default top 8, or the route the user named).

For each, write the **loading sequence** as a numbered timeline, then the defects:

```
/route  (n <n>, LCP <s> = ttfb <s> + delay <s> + load <s> + render <s>, LCP element: <selector>)
1. First HTML flush: <what is in it - nav? header? card frames? or a skeleton/blank?>
2. Waits on: <await / use() / Suspense boundary / provider gate, file:line>
3. Hydration: <client components that must hydrate before the LCP element shows>
4. Client fetches: <request A -> request B (dependent) ...>
5. LCP element paints after: <step N>
Defects: [CONFIRMED|SUSPECTED] <checklist step> <file:line> <quoted line> -> <fix shape>
```

What to look for is the vault checklist steps 2-5 and 7. The patterns that most often explain a
large render delay with a fast server:
- An `await` in a layout or `page.tsx` above the JSX that draws the chrome.
- A `<Suspense>` around a layout's `{children}`, or one boundary around many independent sections.
- A client component calling `use()` (or a provider returning null/skeleton until a fetch resolves)
  above the chrome.
- Mount gates: `useEffect(() => setMounted(true))`, `dynamic(..., { ssr: false })` on chrome,
  `useSyncExternalStore` hydration guards, `opacity-0`/`invisible` until ready.
- Sidebar/nav: session, org, permission or feature-flag reads that gate rendering; collapsed state
  read from `localStorage` after mount (late render or shift); `<Link>` viewport prefetch firing a
  server render per visible link.
- Client fetch chains: query B keyed on query A's result; fetch-on-mount that could start on the
  server and stream.

**Fan out for more than three routes.** Spawn read-only subagents in one message, one per route
group (shell, then 2-4 routes each), using the brief in `references/route-trace-brief.md` with the
field numbers and LCP element pasted in. Pass the model explicitly. Subagents do the work
themselves and spawn nothing. Keep to about 8 at once.

Confirm before flagging: read the file; a "waterfall" must be a real dependency, not two awaits that
are already parallel.

## Step 4 - Responsiveness and smoothness

1. **INP routes over 200 ms**: use the INP phase split from step 2 to pick the cause, then find the
   handler (checklist step 6): synchronous work in the click, a filter change re-rendering a large
   table or chart without `startTransition`/`useDeferredValue`, thousands of nodes mounted in one task.
2. **CLS routes over 0.1**: name the shifting element and whether it moved after load (checklist
   steps 7-8): unreserved space, skeleton height not matching content, late-loading fonts or images,
   content inserted above the fold after a refetch.
3. **Loading choreography** (checklist step 7): skeleton on first load only, the settled answer
   held and dimmed on a refetch, an onset delay so fast answers show no flash, no `0` or empty message
   while loading, one spinner style. Implementation fixes belong to `audit-loading-animations`; report
   them here and point there.

## Step 5 - Platform

Checklist step 9. On Vercel, read the project and the latest production deployment (REST endpoints
in `references/field-data.md`; the claude.ai Vercel MCP may be scoped to another team, so fall back
to REST with the token from the credentials store named in the global CLAUDE.md):
- Function region (`vercel.json` `regions` overrides the project default) vs the database region.
- Skew Protection on (`skewProtectionMaxAge` set), especially when production deploys several times a
  day.
- Fluid compute, Speed Insights enabled, production deploy frequency, runtime errors on slow routes.

## Step 6 - Report

Write the report to the scratchpad (or where the user asks) and give the summary in chat. Offer to
publish it as an artifact when it is for someone else.

```
# Page loading audit - <app> - <date UTC+8>

Stack: <...>   Field source: <PostHog|Speed Insights|CrUX|none>, last 30 days
Versions: next <installed>/<latest>, react <installed>/<latest> - <verdict>   Checklist: <date>, <refreshed|current>

## Routes by traffic
| Route | n | LCP | biggest LCP part | INP | CLS | TTFB | LCP element |

## Shell
<loading sequence + defects>

## Per route (top N)
<loading sequence + defects, per route>

## Findings, ranked
1. [CONFIRMED] <title> - routes affected, field number, file:line, mechanism, fix shape, checklist step
...

## Platform
## Not checked / SKIPPED
```

Rank by **(traffic x size of the excess over target)**, with shell defects first when they explain
several routes. Mark each finding CONFIRMED (code path read end to end) or SUSPECTED. State what was
not checked.

## Step 7 - Capture

- App-specific findings go in the app repo (its specs or docs), never the vault.
- A new, reusable technique learned in the run: offer to add it to the vault note's checklist (the
  global CLAUDE.md "CAPTURE AFTER" rule). `/research` runs already update the note themselves.
