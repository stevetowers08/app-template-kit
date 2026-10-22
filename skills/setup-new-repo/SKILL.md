---
name: setup-new-repo
description: Set up a repo's agent scaffolding - an AGENTS.md skeleton stating conventions you confirm rather than ones it invents, a `verify` command composed only from commands it has actually run to completion, and one commit. Default mode deliberately stops there - rules files, specs trees, hooks and subagents are earned later. `--full` adds the complete docs architecture (docs/ hub, spec + ADR + guide + reference + rule templates) as headings-only templates for a greenfield pro repo. Use when starting a new repo, adding AGENTS.md / CLAUDE.md to an existing one, or standardising a repo an agent is about to work in.
disable-model-invocation: true
argument-hint: "[--full]"
allowed-tools: Bash, Write, Edit, Read, Glob, Grep, AskUserQuestion
last_verified: 2026-08-21
---

# setup-new-repo

Two modes. Default is three steps, then stop.

```
DEFAULT (no args)                    --full
1. AGENTS.md skeleton                1. AGENTS.md skeleton
2. npm run verify                    2. npm run verify
3. commit both                       2b. docs/ + src/ tier architecture
                                     3. commit all
```

**Default** is for standardising a repo that already exists, or any repo where you do not yet
know what the docs tree needs to hold. It writes two files and a command.

**`--full`** is for a greenfield repo you intend to build properly from day one. It adds the
whole docs architecture and the code-tier skeleton as **headings-only templates** - every
directory contains a real template or a purpose README, never a `.gitkeep`.

Read the trade honestly before choosing `--full`: the vault's own new-repo sequence
(`Process & Shipping/Where Conventions Live.md` -> "Setting up a new repo") says *earned, not
installed*, and the measured failure is `docs/decisions/` holding a `.gitkeep` in month four.
`--full` accepts that risk deliberately in exchange for a complete tree on day one. It is a
choice, not the default, and Step 2b names what it costs.

## The constraint is what the default mode does NOT do

No rules files. No specs tree. No hooks. No subagents. No `docs/` hierarchy. No design stubs.
No `.mcp.json`. Those are **earned**, and scaffolding them up front is how you get empty
directories nobody ever fills.

A rules file written before you know what is long and narrow is an empty file. A hook written
before something has been violated twice is cargo cult. `docs/decisions/` created on day one and
still holding nothing but a `.gitkeep` in month four is the measured version of this, in a repo
whose `docs/index.md` advertises it.

Triggers for each of them are in **Earned later** at the bottom. None fires on day one.

**Even under `--full`, hooks, subagents and `.mcp.json` are never scaffolded.** They stay
earned in both modes - a hook has to be bought by a second violation, and an empty
`.claude/hooks/` is a measured failure in a real repo (see Part A-full). What `--full` relaxes
is the *docs and tier* half only.

## Rule 0 - never compose a command by inference

**This is the failure this skill exists to avoid.** A script's presence in `package.json` says
nothing about whether running it does anything, or whether it ever exits.

Measured across eleven repos:

| Shape | Reads as | Actually is |
|---|---|---|
| `"test": "vitest"` | a test command | watch mode. **Never exits.** Composed into `verify` it hangs forever. Three of eleven repos |
| `"test": "echo \"Error: no test specified\" && exit 1"` | a test command | the `npm init` placeholder. Exits 1 by design |
| `"lint": "turbo run lint"` | a lint command | zero workspaces define `lint`. Exit 0 in 91 ms, checks nothing |
| `"typecheck": "turbo run typecheck"` | full coverage | only workspaces that declare the task. The root package is usually outside `workspaces`, so a whole backend directory is checked by nothing |

So: **survey, propose, confirm.** Never write a `verify` containing a command you have not
personally run to completion in this repo.

## Procedure

### 0. Read what is already there

`AGENTS.md`, `CLAUDE.md`, every `package.json` (all of them, in a monorepo), framework config,
the lockfile, `.git`. **Never overwrite real content** - merge missing sections only.

One CLAUDE.md slot: root `./CLAUDE.md`, never `.claude/CLAUDE.md`. If `.claude/CLAUDE.md` already
holds real content, stop and ask which to keep.

### 1. Ask - then AGENTS.md, stated not invented

**One batch. Two questions, three at most.** Keep them short - the reasoning below is reference
for writing good one-line option descriptions, not a script to read out.

| Ask | Why it cannot be read |
|---|---|
| Project name + one-sentence purpose | Nothing in the tree states intent. Free text, not options |
| **App profile** (below) | A greenfield tree is empty or a bare `create-next-app`. The profile is a decision about where it is going, not a fact about where it is |
| Which agent tools are in use | **Only if ambiguous.** Claude Code plus anything else -> AGENTS.md + thin CLAUDE.md. Do not ask when the answer is already known |

Each option gets a **one-line** "choose this when". A profile question whose options are four
bare stack names gets answered by vibe; a paragraph per option is worse. One line.

#### App profiles

Detect the likely one first and offer it as the recommendation, but always confirm - `--full` on
the wrong profile writes a whole tree that has to be deleted.

| Profile | Choose when | Do not choose when | Code tiers scaffolded |
|---|---|---|---|
| **Next.js full-stack app** | Server work and UI in one deploy - App Router, Server Actions, a database, auth. The default for a product app | You have no server, or the backend is a separate service you do not deploy | `src/app` (routing only) · `components/{ui,layout}` · `features/<domain>` · `lib` |
| **React + Vite SPA** | A pure client app - the backend is Supabase, an edge function, or someone else's API. Static host | You need SSR, SEO on content pages, or server-side secrets | `src/pages` (thin route components) · `components/{ui,layout}` · `features/<domain>` · `lib` |
| **Monorepo (Turborepo)** | Two or more deployable apps genuinely sharing code. Earned by the *second* app existing, never by predicting it | There is one app. `packages/ui` with one consumer is pure overhead | `apps/<name>/` each with the tiers above · `packages/{ui,config}` · per-package `AGENTS.md` |
| **Service / worker / CLI** | Scrapers, schedulers, queue workers, MCP servers - no UI at all | Anything renders | `src/{commands,services,lib}` · no `components/`, no design docs |
| **Library / package** | Published or consumed by other repos. The public API is the product | It is an app that happens to export something | `src/index.ts` public API · `src/internal/` · no `app/` |

The tiers are one-way in every profile: **routes -> features/components -> lib.** `lib/` never
imports from `components/` or `app/`, and holds no React. That single rule is what
`/audit-architecture` scores hardest, so state it in AGENTS.md whichever profile is chosen.

**Everything else you read, never ask and never guess.** Stack, versions, package manager and
monorepo layout come from the manifests and the lockfile. Never write a version number you did
not read.

Then write the skeleton from `references/templates.md`:

- **Only sections that are true today.** An empty "Known gotchas" heading is worse than no
  heading - it reads as an assertion that there are none.
- **Only directories that exist.**
- **No convention you inferred.** If the tree does not settle it and the user did not state it,
  leave it out. A wrong convention in an always-on file is worse than a missing one, because the
  agent will follow it.
- Target 100-200 lines. `CLAUDE.md` is thin - first line `@AGENTS.md`, then Claude-only notes.
  **The target applies to the combined root**, because the import composes AGENTS.md in. Counting
  `CLAUDE.md` alone is theatre.

### 2. verify - declared, not inferred

**a. Enumerate candidates.** Every script in every `package.json`, plus the obvious unscripted
ones for this stack (`tsc --noEmit`, the formatter, the build).

**b. Run each one individually, with a timeout.** Four columns per candidate, and all four
matter:

| Record | Because |
|---|---|
| exit code | exit 1 by design (the `npm init` placeholder) and exit 1 for real look identical in a script name |
| **did it terminate** | bare `vitest` / `jest --watch` never will. Use a timeout and treat a hit as a failure, not a slow pass |
| wall time | decides which tier it belongs in |
| **unit count** | files, tests, packages, diagnostics. A command that executed zero units is the worst shape available - green, fast, and checking nothing |

**c. Propose. Do not write yet.** Show the table, then the proposed `verify` with one line per
candidate saying why it is in or out, and **wait for confirmation.** Call out explicitly:

- anything that **cannot pass today**. Ship `verify` green or do not ship it. A gate that cannot
  pass is not strict, it is broken, and it trains everyone to bypass - which disables the legs
  that do work
- anything needing credentials or a live service. That is a second tier (`verify:data`), a
  deliberate act, not what runs before ending a turn
- anything whose **name is broader than its coverage**. Put the real coverage in the AGENTS.md
  Commands table, not the name

**d. Write it, run it once, paste the output.** If it is not green, it is not done.

### 2b. Full architecture - `--full` only

Skip this entire step without the flag.

Write the trees in `references/templates.md` -> **Part A-full**, for the confirmed profile.
Four rules govern every file written here:

1. **No empty directory, ever.** Each one gets either a `_template.md` (docs) or a short
   purpose `README.md` naming its one job and the import direction (code tiers). A directory
   whose only content is `.gitkeep` is the failure this skill was built to avoid, and `--full`
   is the mode most likely to produce it.
2. **Templates are headings, not prose.** A `_template.md` is a skeleton to copy - it asserts
   nothing about this repo. That is why it is safe on day one, and why an empty *section in
   AGENTS.md* still is not: one is a form, the other is a claim.
3. **`docs/index.md` is written last and links only what exists.** It is the hub every other
   doc is found through, so a link to a file you did not write is the first rot in a repo whose
   first commit has not landed.
4. **`docs/design/` is not written here.** That is `/setup-design-system`, which extracts real
   tokens from real code. A hand-stubbed `design.md` competes with it for the same slot.

Then say plainly which directories are now empty of real content and what fills each one. That
sentence is the honest cost of `--full` and the user should read it before the commit.

### 3. Commit

Everything written, manifest included. Named paths only - never `git add -A`. Message:
`chore: add AGENTS.md and a verify command`, or for `--full`,
`chore: scaffold repo architecture, AGENTS.md and a verify command`. Do not push unless asked.

## Earned later - and the trigger for each

Do not create these now. Each row is the trigger.

**`--full` pre-creates the template for four of these** (`docs/specs/`, `docs/decisions/`,
`docs/prds/`, `.claude/rules/`) - the empty form, never a filled one. The trigger below still
governs when you *write into* it. A repo on `--full` whose `docs/specs/` still holds only
`_template.md` in month three has not failed the skill; a repo that filled one because the
directory existed has.

| Thing | Earned when |
|---|---|
| `.claude/rules/<topic>.md` | a convention has recurred **in this repo** and is narrow enough to scope with `paths:`. Write the repo rule first - it promotes to the vault only when a *second* repo needs it. Surveyed across four repos, only two have rules at all and both independently landed on the same three topics - **auth, database, error-handling**. Expect those to be the ones that recur; still wait for the recurrence rather than pre-writing them |
| A hook | a rule has been violated **twice** despite being written down. That is the trigger, not "this one feels important" |
| A subagent | you keep spawning the same worker with the same instructions, and its output floods the main context with logs you will never reference again |
| `docs/specs/` | the first change spanning more than two or three files |
| `docs/design/` + `/setup-design-system` | the first real UI work - which for a frontend repo means **`/setup-shadcn` -> `/setup-theme` -> `/setup-design-system`**, in that order. The first two put real components and real tokens on disk; the third extracts them. Running the extractor before them documents the shadcn defaults, which is why this skill still writes no `docs/design/` itself |
| `.mcp.json` | the first MCP server this repo actually needs |
| Per-directory `CLAUDE.md` | a directory has conventions that genuinely differ from the root's |
| A mechanical checker (`scripts/check-rules.mjs`) | the first `.claude/rules/` file exists, so there is finally something to validate |

Shapes for every one of these are in `references/templates.md` - reference material for when a
trigger fires, not a checklist to work through now.

## See also

- `/audit-repo` - the judgement-half audit of a repo that has grown past this scaffold: does
  `verify` still check anything, what the test config excludes, always-on tokens, doc rot
- `/audit-documentation` - scores an existing repo against the full docs architecture
- `/setup-shadcn` - the frontend continuation of this skill. It calls `/setup-new-repo` as its own
  first step, then does shadcn init, theme, auth, fonts and an app shell. If the repo being
  scaffolded is a frontend app, that command is the entry point and this one is a step inside it
- `/setup-theme` - applies a named visual language (from the vault's Design System style pages)
  to a shadcn app. Runs after `/setup-shadcn`, before `/setup-design-system`
- `/setup-design-system` then `/audit-design-system` - the design-system generate + score pair.
  Generate only once the two commands above have put real tokens and components on disk
- `/setup-error-handling` - at the first API route. It already encodes the error spine that
  recurred independently across two of the surveyed repos (`lib/errors.ts` + `withApiHandler` +
  `fetchWithRetry`, expected-vs-unexpected, never report 4xx). Do not hand-roll a replacement
