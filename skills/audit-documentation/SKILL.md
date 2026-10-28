---
name: audit-documentation
description: Audit a repo's documentation against the standard architecture — canonical AGENTS.md, thin CLAUDE.md, path-scoped rules, docs/ Diataxis layout, and design hierarchy. Reports a scored health check, then offers to apply safe fixes. The inverse of /setup-new-repo (which scaffolds the same architecture).
disable-model-invocation: true
allowed-tools: Bash, Read, Glob, Grep, Edit, Write, AskUserQuestion
last_verified: 2026-08-21
---

Audit the documentation in the current working directory against the standard project
architecture and report its health. This is the inverse of `/setup-new-repo`: that command
**scaffolds** the canonical architecture; this one **checks an existing repo against it** and
offers to fix drift.

**Target architecture (the source of truth for this audit) is exactly what `/setup-new-repo`
produces.** If `/setup-new-repo` changes, update both. Summary of the target state:

- `AGENTS.md` — universal, cross-tool source of truth (stack, conventions, commands, structure). Target 100–200 lines.
- `CLAUDE.md` — thin: first line imports/points to AGENTS.md (`@AGENTS.md`), then Claude-only notes (skills, routing, MCP, hooks). One CLAUDE.md slot only (`./CLAUDE.md` OR `./.claude/CLAUDE.md`, never both).
- `.claude/rules/*.md` — project-specific config, each with `paths:` frontmatter so it loads only on matching files.
- `docs/` — organised by Diátaxis (tutorial / how-to / reference / explanation), with a hub `index.md`.
- `docs/design/` — `design.md` (tokens), `components.md`, `personas.md`, `voice.md`, `tokens.css`.
- `docs/decisions/` — ADRs. `docs/prds/active|draft|archive/` — product PRDs (what/why + acceptance criteria). `docs/specs/` — per-feature build specs (the how, one per slice). Format guidance: `Process & Shipping/PRDs and Specs for AI Coding Agents.md`.
- Per-directory `CLAUDE.md` in each major source dir (src/, app/, supabase/, …).

Default run is **report-only**. After the report, offer to apply safe fixes (Step 7). Never
merge or delete prose silently.

## Step 1 — Scope & inventory

Build a complete picture before judging anything. Do not skip — accuracy depends on it.

```bash
echo "=== Root markdown ==="; ls -1 *.md 2>/dev/null
echo "=== Agent files ==="; find . -path ./node_modules -prune -o \( -name 'CLAUDE.md' -o -name 'AGENTS.md' -o -name 'CLAUDE.local.md' \) -print 2>/dev/null
echo "=== docs/ tree ==="; find docs -type f 2>/dev/null | sort
echo "=== .claude/rules ==="; ls .claude/rules/ 2>/dev/null
echo "=== line counts ==="; wc -l AGENTS.md CLAUDE.md .claude/CLAUDE.md 2>/dev/null
```

Read `AGENTS.md`, the project `CLAUDE.md`, and `docs/index.md` (if present) in full. Skim each
`docs/` file's first 10 lines to classify it. If the repo has a `/research` command,
note that the audit covers **structure**, not tech currency — recommend `/research` for
version/deprecation checks of the stack itself.

## Step 2 — Audit the agent-instruction layer

Check against the target. Record each as PASS / WARN / FAIL with the evidence.

1. **AGENTS.md exists and is canonical** — contains the real stack/conventions/commands, not a stub. FAIL if missing; WARN if it's a thin pointer while `CLAUDE.md` holds all the content (inverted).
2. **CLAUDE.md is thin and linked** — first non-comment line is `@AGENTS.md` (import) or an explicit "Read AGENTS.md first" pointer. FAIL if `CLAUDE.md` and `AGENTS.md` are two independent full files with no link (drift hazard). WARN if Claude-only content (skills, hooks, MCP) is missing and buried in AGENTS.md instead.
3. **One CLAUDE.md slot** — not both `./CLAUDE.md` and `./.claude/CLAUDE.md` with real content. FAIL if both.
4. **Size** — AGENTS.md ≤ ~200 lines (target 100–200); any single CLAUDE.md ≤ ~200 lines. WARN over 200 (measurably reduces adherence) — recommend splitting into `.claude/rules/`.
5. **Rules are path-scoped** — every `.claude/rules/*.md` that is domain-specific has `paths:` frontmatter. WARN for unscoped rules that should be scoped. Note the Write-not-Read caveat: creation-time-critical guidance must live in AGENTS.md, not a path-scoped rule.
6. **Per-directory CLAUDE.md** — major source dirs (src/, app/, supabase/, packages/) have their own CLAUDE.md. WARN on large dirs with none.
7. **No duplication across layers** — agent files should *point at* `docs/`, not restate it. FLAG any section copied between AGENTS.md/CLAUDE.md and docs/.

## Step 3 — Audit the docs/ structure (Diátaxis)

1. **Hub exists** — `docs/index.md` with an intent table ("if you want X → go to Y"). WARN if missing.
2. **Diátaxis separation** — docs are classifiable into tutorial / how-to / reference / explanation, and no single page mixes "how" and "why". FLAG mixed-type pages (e.g. a "getting started" that is tutorial + how-to + concept at once).
3. **Design hierarchy** — `docs/design/` has `design.md`, `components.md`, `personas.md`, `voice.md`, `tokens.css` (case-insensitive; accept the repo's existing casing but flag inconsistency). WARN per missing file.
4. **Decisions, PRDs & specs** — `docs/decisions/` (ADRs), `docs/prds/active|draft|archive/` (product PRDs), and `docs/specs/` (per-feature build specs) exist where the project has durable decisions or specs. WARN if decisions/PRDs/specs are scattered in root instead, or if `docs/prds/` exists but `docs/specs/` is missing on a project that's actively building features.
5. **No duplicate folders** — e.g. both `docs/prd/` and `docs/prds/`. FAIL.

## Step 4 — Audit content health (anti-rot)

1. **One source of truth per topic** — search for duplicate authorities (design, testing, architecture, product often have 2–3 competing files). FAIL each topic with >1 canonical-looking doc. List which to keep.
2. **Stale / contradictory docs** — docs that contradict the current code or each other (wrong font, removed colour, dead stack, superseded PRD presented as current). FAIL — these actively mislead agents. Compare against the design tokens / code where cheap to verify.
3. **Root clutter** — anything beyond `README.md`, `AGENTS.md`, `CLAUDE.md` (+ LICENSE/CONTRIBUTING) at root. Audit reports, backlogs, old PRDs, architecture dumps belong in `docs/`. WARN each.
4. **Archive hygiene** — superseded docs live in `docs/archive/` AND carry a `> SUPERSEDED — do not follow` banner naming the live source. FAIL a stale doc with no banner.
5. **Generated docs are labelled** — reference docs built from code (token tables, API refs) state where they're generated from, so nobody hand-edits the wrong copy. WARN if unlabelled.

## Step 5 — Cross-reference / broken-link check

Grep for internal links to files that were moved or never existed:

```bash
# Pull every relative .md link target and check it resolves
grep -rEoh '\]\(([^)]+\.md)[^)]*\)' --include='*.md' . 2>/dev/null | sed -E 's/\]\(([^)#]+).*/\1/' | sort -u
```

For each suspicious target, verify the file exists. Common offenders: a hub `index.md` linking
to a `build-log.md` / `changelog.md` that was never created, links to files that moved into
`docs/`. List every broken link with its source file and line. Exclude links inside
`docs/archive/` and dated audit reports — those are point-in-time records, correct to leave.

## Step 6 — Score & report

Output a scored health check. One row per dimension, PASS / WARN / FAIL, plus an overall grade.

```
# Documentation Audit — [repo name]

Overall: [A–F]  ([n] FAIL, [n] WARN, [n] PASS)

| Dimension | Verdict | Notes |
|---|---|---|
| AGENTS.md canonical        | … | … |
| CLAUDE.md thin + linked    | … | … |
| One CLAUDE.md slot         | … | … |
| Size budgets               | … | … |
| Path-scoped rules          | … | … |
| Per-directory CLAUDE.md    | … | … |
| docs/ hub + Diátaxis       | … | … |
| Design hierarchy           | … | … |
| Decisions / PRDs           | … | … |
| One source of truth        | … | … |
| Stale / contradictory      | … | … |
| Root cleanliness           | … | … |
| Archive hygiene            | … | … |
| Broken links               | … | … |
```

Then a **Findings** list ordered by severity (FAIL → WARN), each with: the file(s), the problem,
and the concrete fix. Separate a **Needs your judgment** section for anything that requires a
human decision (which of two competing docs is canonical; a design-truth conflict you can't
resolve from code; whether a doc is truly superseded). Never guess these — flag them.

## Step 7 — Offer to fix

After the report, ask once whether to apply the **safe** fixes. Safe = mechanical and reversible:

- Move root clutter into `docs/` with `git mv` (preserves history)
- Merge duplicate folders (`docs/prd/` → `docs/prds/`)
- Archive a clearly-stale doc into `docs/archive/` + add the SUPERSEDED banner
- Fix broken internal links
- Flip inverted agent files: make `AGENTS.md` canonical + reduce `CLAUDE.md` to `@AGENTS.md` + Claude-only notes
- Repoint references that break when files move

**Never** in the auto-fix pass: merge prose between two docs, delete content, or pick a winner
between competing sources of truth. Those stay in "Needs your judgment" and are only done if the
user explicitly directs it. When moving files, grep for inbound links first and fix them in the
same change. Report the file tree after applying.

If the repo has no `AGENTS.md`/`docs/` scaffold at all, recommend running `/setup-new-repo` first,
then re-running this audit.

## See also
