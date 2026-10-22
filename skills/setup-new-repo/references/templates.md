# setup-new-repo - templates

Three parts, and the split matters.

- **Part A - day one.** What the skill writes in **both** modes. Fill from the Step-1 answers and
  from the manifests; omit every section that is not true today; never overwrite real content.
- **Part A-full - `--full` only.** The architecture trees. Written only when the flag is passed
  and only for the confirmed profile. Headings-only templates and purpose READMEs, never filled
  content, never a bare directory.
- **Part B - earned later.** Shapes to reach for **when the trigger in the SKILL.md table
  fires.** Not a checklist. Creating any of these on day one is the failure mode the skill is
  built to avoid.

`[placeholders]` must be replaced with real values before the commit.

---

# Part A - day one

## Which file(s) - decide before writing

| Situation | Setup |
|---|---|
| Only ever Claude Code | Just `CLAUDE.md`. **Do not** add `AGENTS.md` for symmetry |
| Only Codex / Cursor / Aider / Gemini, no Claude Code | Just `AGENTS.md` |
| Claude Code **and** another tool | `AGENTS.md` canonical + a thin `CLAUDE.md` whose **first line** is `@AGENTS.md` |
| Mixed tools, monorepo | Root `AGENTS.md` + importing `CLAUDE.md`, plus per-package `AGENTS.md` where subprojects genuinely differ. Nearest file wins in both tools |

`AGENTS.md` is the open cross-tool standard (Linux Foundation / Agentic AI Foundation) read by
Codex, Cursor, Copilot, Windsurf, Aider. One CLAUDE.md slot only: root `./CLAUDE.md`, never
`.claude/CLAUDE.md`.

## AGENTS.md

Target 100-200 lines. Delete every heading you cannot fill with something true.

```markdown
# [Project Name]

[One sentence: what this is and who uses it.]

## Stack
- Language: [read from the manifest]
- Platform: [read from the manifest]
- Database: [...]   Auth: [...]   UI: [...]   Deploy: [...]

Read versions from the manifests, never from here.

## Structure
[Only directories that exist. A brief map, not a file-by-file description.]

## Commands
| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run verify` | [name the real coverage here, not the script name] |

## Conventions
[Only conventions the user stated or the tree unambiguously settles.
 Naming, import order, key abstractions. Nothing inferred.]

## Don't touch
[Protected files and directories, with the reason.]
```

Two headings deliberately absent from day one: **Known gotchas** (an empty one asserts there are
none) and **Design System** (that arrives with `/setup-design-system`).

Content test, applied per line: *would removing this cause an agent to make a mistake?* If no,
cut it. Exclude anything an agent can derive by reading the code, anything that changes often,
and any standard language convention it already knows.

## CLAUDE.md - thin

```markdown
@AGENTS.md

# Claude-specific notes

[Claude-only surfaces: skill routing, MCP, permissions. Nothing that belongs in AGENTS.md.]
```

The first line is a literal import (max 5 hops) that composes AGENTS.md in, so **the 100-200
line target applies to the combined root.** `@path` imports do not reduce context - only
`paths:`-scoped rules do, and those are Part B.

## .gitignore additions

```
.claude/settings.local.json
CLAUDE.local.md
.env.local
```

Add `.mcp.json` only if and when one is created, and only if it holds a token.

---

# Part A-full - `--full` only

## What earned its place, and how it was decided

Surveyed across five repos actually on this machine (`retention-engine`, `RankAgent`,
`command-center`, `fill-your-venue`, `tour-bi-polaris`). The vault rule is: **do not build a repo
template from one repo - extract only what survived contact with the second.**

| Convention | Repos using it | Verdict |
|---|---|---|
| `docs/design/` | 5 of 5 | Scaffold. But via `/setup-design-system`, never stubbed here |
| Rules: `database`, `auth`, `frontend`/`ui` | 3 of 3 with a `rules/` dir | The recurring three. Template these |
| `docs/archive/` | 3 of 5 | Scaffold |
| `docs/decisions/` | 2 of 5 | Scaffold |
| A PRD/plan directory | 4 of 5 | Scaffold - but **one** name, see the drift note |
| `docs/index.md` hub | 2 of 5 | Scaffold. Its absence is what makes the other three unfindable |
| `docs/specs/` | 1 of 5 | Scaffold anyway - the flag is for repos that intend to work this way |
| Diataxis `howto-*`/`explanation-*` prefixes | **1 of 5** | **Do not scaffold.** Documented in the vault, adopted once. Offer it in `docs/index.md` as a convention to follow, do not pre-create the files |
| Rules: `payments`, `scraping`, `e2e`, `llm-validation` | 1 each | Do not scaffold. These are exactly what "earned later" means |

Three measured failures the same survey turned up, which the trees below are shaped to avoid:

- **Empty directories.** `tour-bi-polaris/.claude/` carries `agents/`, `commands/` and `hooks/`,
  all three completely empty. This is the failure mode, in the most mature repo of the five.
- **The plural drift.** `tour-bi-polaris` has both `docs/prd/` **and** `docs/prds/`;
  `command-center` has `docs/prd/` and `docs/prdv1`. Pick one name, write it into AGENTS.md, and
  never create the sibling.
- **Root and docs-root clutter.** `retention-engine/docs/` mixes `DEPLOY.md`, `SECRETS.md` and
  two loose PRD dumps in with its subdirectories. The hub exists to prevent this; use it.

## The docs tree

```
docs/
  index.md              # hub - written LAST, links only what exists
  specs/_template.md    # per-feature build spec: the how, one per slice
  decisions/_template.md# ADR - durable eng decisions
  prds/_template.md     # product PRD: what/why + acceptance criteria. ONE name, never also prd/
  archive/README.md     # superseded docs, banner required
```

`docs/design/` is deliberately absent - `/setup-design-system` extracts it from real code.

### `docs/index.md`

```markdown
# Docs

| If you want to... | Go to |
|---|---|
| [fill in as docs are written] | |

## Conventions
- One source of truth per topic. Cross-link, never restate.
- Diataxis file prefixes for loose docs: `tutorial-` / `howto-` / `reference-` / `explanation-`.
  One intent per page - never mix "how" and "why".
- Superseded docs move to `archive/` with a `> SUPERSEDED - do not follow` banner naming
  the live source. Do not delete.
- Any doc holding column names, counts or version pins is generated and `--check`ed, or deleted.
```

### `docs/specs/_template.md`

```markdown
# [Feature]

## Problem
## Approach
## Scope
### In
### Out
## Acceptance criteria
## Risks

## Outcome
<!-- Append-only, filled AFTER the build. What actually happened, what surprised you.
     Never edited once written - this is the repo's memory. -->
```

### `docs/decisions/_template.md`

```markdown
# ADR-[NNN]: [decision]

- **Date:** [YYYY-MM-DD]
- **Status:** proposed | accepted | superseded by [ADR-NNN]

## Context
## Decision
## Consequences
```

### `docs/prds/_template.md`

```markdown
# [Product change]

## Problem
## Users affected
## Success criteria
## Requirements
## Out of scope
```

### `docs/archive/README.md`

```markdown
# Archive

Superseded documents, kept for history. Every file here carries a
`> SUPERSEDED - do not follow` banner naming its live replacement.
Nothing in this directory is current. Do not follow it.
```

## The code tiers, per profile

One-way in all of them: **routes -> features/components -> lib.** Each directory gets the
purpose README below, so none of them is empty at the first commit.

```
# Next.js full-stack              # React + Vite SPA
src/                              src/
  app/                              pages/          # thin route components
  components/{ui,layout}/           components/{ui,layout}/
  features/<domain>/                features/<domain>/
  lib/                              lib/

# Service / worker / CLI          # Library
src/{commands,services,lib}/      src/index.ts      # the public API IS the product
                                  src/internal/
```

Monorepo: each `apps/<name>/` takes the matching tree above, `packages/{ui,config}`, and a
per-package `AGENTS.md` only where conventions genuinely differ from the root.

### Tier `README.md` - one per directory

```markdown
# [tier]/
[One sentence: its single job.]

**Imports:** [what it may import] · **Never imports:** [what it must not]
```

Filled for the four that recur:

| Directory | Job | Never imports |
|---|---|---|
| `app/` or `pages/` | Routing only - `page`/`layout` and per-segment `_components/`. No business logic | - |
| `components/ui/` | Domain-agnostic primitives. Where shadcn installs | `features/`, `app/` |
| `components/layout/` | App shells - header, sidebar, footer | `features/` |
| `features/<domain>/` | One domain, self-contained: components, hooks, actions, queries, schemas, types. Deletable by deleting the folder | another `features/` sibling |
| `lib/` | Infrastructure - db client, auth config, third-party clients, generic utils | `components/`, `app/`. **No React** |

## `.claude/rules/` - the recurring three only

Write `_template.md` plus **only** the rules the confirmed profile actually needs, each as an
empty-bodied file with real `paths:`. The three that recurred across every repo with a rules
directory: `database`, `auth`, `frontend`/`ui`. Do not pre-create `payments`, `scraping`, `e2e`
or `llm-validation` - each appeared in exactly one repo, which is the definition of earned later.

Shape and the `paths:` caveats are in Part B - they apply unchanged here.

---

# Part B - earned later

Reach for one of these **only** when its trigger in the SKILL.md table has fired.

## `.claude/rules/<topic>.md`

Path-scoped, project-specific config only - global rules in `~/.claude/rules/` already apply.

```yaml
---
paths:
  - "src/api/**/*.ts"
  - "supabase/**"
---
```

- **No `paths:`** means it loads every session, at the same cost as CLAUDE.md. That is a decision,
  not a default - make it deliberately.
- **The caveat that breaks it:** path-scoped rules fire on **Read** of a matching file, not on
  **create**. A rule scoped to `src/api/**` will not reach an agent writing a new API file from
  scratch. Keep creation-time-critical guidance in AGENTS.md.
- **They are also not re-injected after a `/compact`.** A small number of cross-cutting rules
  deliberately repeated in AGENTS.md is correct, not duplication - say so in a comment where you
  do it, or the next audit will cut them.
- One topic per file, descriptive filename. State the **decision**; link to the vault for the
  **why**; never restate a **fact** the code already carries (that is a generator, not a doc).

Subagents do **not** reliably receive rules files. To get a convention into one, use the agent's
`skills:` field or a hook.

## A hook

Trigger: violated twice despite being written down. Not before.

```json
{ "hooks": { "PreToolUse": [ { "matcher": "Bash",
  "hooks": [ { "type": "command", "command": "node .claude/hooks/<name>.mjs" } ] } ] } }
```

- Give every hook an escape hatch (an env var, or a marker comment in the change).
- **Fail open on the hook's own internal errors.** A hook that fails closed on a bug of its own
  blocks all work and gets switched off within the hour.
- Header comment names the incident that bought it, so a later audit does not read it as cargo
  cult.
- A `Stop` hook that always blocks loops forever - check `stop_hook_active` and exit 0 on the
  second pass.

## A subagent (`.claude/agents/<name>.md`)

```yaml
---
name: <name>
description: <what, plus the natural-language phrases that should trigger it - a slash command is not a trigger>
tools: Read, Grep, Glob        # allowlist. A reviewer with Edit is a defect
model: sonnet                  # omit to inherit
---
```

Project scope (`.claude/agents/`) travels with the repo; `~/.claude/agents/` is per-machine and
not synced. A subagent gets its own system prompt, the CLAUDE.md hierarchy, a git-status
snapshot, and its `skills:` content - **not** the parent conversation, and not the parent's
rules.

## A mechanical checker (`scripts/check-rules.mjs`)

Trigger: the first rules file exists. Validates what a script can settle - dead links, undefined
`npm run` references, missing `paths:`, globs matching nothing, stale generated blocks.

Two properties that decide whether it survives:

- **Warn/fail split.** FAIL for what is wrong in every state of the tree. WARN for what is only
  probably stale (a glob may be the documented home for something not yet written). A check that
  fails on a legitimate empty gets switched off, and takes the useful checks with it.
- **A coverage assertion per pass** - the count it expects to have examined. A pass that
  discovers nothing and reports green is worse than no check, because it reads as coverage.

Every mechanical finding from `/audit-repo` should become a pass here.

## `docs/`

Add a directory when its first real file exists, never as an empty shell with a `.gitkeep`.
`docs/specs/` on the first multi-file change; `docs/design/` via `/setup-design-system`;
`docs/decisions/` only if ADRs are actually being written.

**Any doc holding column names, counts or version pins must be generated and drift-checked
(`--check`), or deleted.** Hand-maintained fact documents rot, and agents are told to trust them.

## `.mcp.json`

Remote HTTP + token, not the deprecated `npx --access-token` stdio form. Gitignore it.

```json
{ "mcpServers": {
  "supabase-<project>": {
    "type": "http",
    "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF",
    "headers": { "Authorization": "Bearer YOUR_PAT" }
  }
}}
```

Add `&read_only=true` for query-only. One entry per project. Prefer `${VAR}` over a literal
where the harness supports it.

## Per-directory `CLAUDE.md`

Only for a directory whose conventions genuinely differ from the root's.

```markdown
# [dir]/
> Loaded when Claude works in this directory.
## Purpose · ## Conventions · ## Key files · ## Gotchas
```
