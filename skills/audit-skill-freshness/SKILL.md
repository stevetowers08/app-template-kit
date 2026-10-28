---
name: audit-skill-freshness
description: Audit the local Claude Code skill library (setup-*, check-*, audit-* and any version-pinned skills) for staleness - detect where a skill's pinned versions, "2026 deltas", or named APIs/config keys have drifted from current best practice, then re-verify the flagged ones against primary sources via /research and propose cited updates for human approval. Use this whenever the user wants to check/refresh/update their skills, asks if their skills are out of date, mentions skill drift or stale guidance, wants to keep skills current with the latest framework versions, or runs a periodic skill-library review - even if they don't name a specific skill. Delegates research to /research and never rewrites a skill without approval.
disable-model-invocation: true
argument-hint: "[skill-name-or-glob | all]  (default: setup-*, check-*, audit-*)"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Skill
last_verified: 2026-08-21
---

# audit-skill-freshness

Keep the skill library honest. Skills that bake in versioned guidance ("Next.js 16", "@sentry/nextjs v10",
"2026 deltas") silently rot as frameworks ship. This skill finds the rot and proposes **cited** fixes -
without inventing updates and without rewriting anything until a human says so.

> When to use: "are my skills out of date?", "check/refresh my skills against best practice", "audit the
> skill library", a quarterly skill review, or after a major framework release. The `audit-` (deep scored
> review) tier. It **delegates the actual research to `/research`** so there's one source of truth
> for how claims get checked, and it **proposes, never auto-commits** changes.

## Why it's built this way (read before running)

The danger isn't missing an update - it's **confidently inventing one**. An LLM asked "what changed in X?"
will happily fabricate a version bump or a renamed API. So the design is deliberate:

- **Deterministic signals first, research second.** Cheaply flag suspect skills (version pins vs ground
  truth, age/TTL) before spending any web-research budget. Most skills won't need the expensive step.
- **Atomic claims, primary sources, dated verdicts.** Decompose a skill into individual claims; verify
  each against an **official/primary** source with a **re-fetched, cited URL**; label it
  `current / outdated / refuted / unverifiable`. No citation ⇒ `unverifiable`, never a "fix".
- **Ground in evidence, not consensus.** Don't confirm a change by asking models to agree - corroborate
  against the vendor's own docs/changelog.
- **Governed update.** Output a proposal with provenance + confidence. A human approves before any edit.
  One bad auto-edit poisons every future invocation of that skill.

## Cadence

Re-check fast-movers (Next.js, React, Sentry, Tailwind, Supabase clients) on a **~30-day** drift window;
everything else **~90 days**. The `last_verified` stamp (added in step 6) makes this cheap to honour.

## Procedure

1. **Inventory.** Resolve the target set from `$ARGUMENTS` (default `setup-*`, `check-*`, `audit-*` in
   `~/.claude/skills/`; `all` = every skill). For each, read SKILL.md frontmatter + body and extract into
   a working list:
   - **Version pins** - any `X vN`, `Next.js 16`, `Zod 4`, `@pkg@^N`, etc. in prose or `references/`.
   - **Dated/delta claims** - "2026 deltas", "verified <date>", "(removed in vN)", named APIs/config keys
     (`instrumentation-client.ts`, `catchError`, `tracesSampleRate`...).
   - **`last_verified`** frontmatter date if present (absent ⇒ treat as never verified).
2. **Deterministic pre-filter (cheap - do this before any web research).** Flag a skill as a **candidate**
   if any of:
   - A version it pins is **older than ground truth** = the versions actually used across the user's repos.
     Detect with: `grep` the skill's pins, then read `C:/Dev/**/package.json` / `.nvmrc` for the real
     versions (e.g. skill says "React 18" but repos run React 19 → drift).
   - **Stale by TTL**: `last_verified` older than the cadence window (or missing), OR the SKILL.md file
     mtime is old relative to a fast-moving pinned dep.
   - Mentions an API/file the skill itself elsewhere calls "removed/deprecated", or an obvious successor
     exists. Report the candidate list and **skip non-candidates** (note them as "fresh, skipped").
3. **Extract atomic claims** for each candidate. One row per verifiable claim - decompose compound bullets
   so a true sub-claim can't hide a false one. Keep each claim to a single checkable assertion (a version,
   an API name, a config default, a file convention).
4. **Re-verify via `/research`.** For each candidate skill (batch its claims into one focused
   topic), **invoke the `research` skill** with the skill's tech + the specific claims to check.
   Require, per claim: a verdict (`current / outdated / refuted / unverifiable`), the **current** value if
   it changed, and a **primary/official source URL** (vendor docs, changelog, release notes - not a
   content-farm blog). If `/research` returns only blog-tier evidence or is uncertain, the verdict
   is `unverifiable` - do **not** upgrade it to a recommended change.
5. **Report (do not edit yet).** Write `audit-skill-freshness-report.md` to the scratchpad using the
   template in `references/report-template.md`: a per-skill status (`current / stale / outdated`), the
   drifted claims with old→new + source link + confidence, and the proposed edit. Lead with a summary
   table. Make `unverifiable` items a separate "needs human eyes" list - never silently dropped.
6. **Governed update (only after the user approves specific items).** For each approved change:
   - Apply the minimal edit to the skill (and its `references/`), preserving everything else.
   - Stamp the skill's frontmatter with `last_verified: <YYYY-MM-DD>` and, where useful, a one-line
     source note next to the claim. For skills with no freshness metadata, add `last_verified` so future
     runs are cheap (the TTL contract).
   - Re-run `npx tsc --noEmit`-style sanity only if the skill ships runnable templates and the user wants it.
   - Summarise what changed, with sources, and which `unverifiable` items still need a human decision.

## Rules

- **Never rewrite a skill without explicit approval of that specific change.** Propose with provenance; the human certifies. This is the whole safety model.
- **Every "this changed" needs a primary-source URL.** Vendor docs / changelog / release notes. No citation ⇒ `unverifiable`, not a recommendation. Never invent a version number or API name.
- **Re-fetch, don't recall.** Confirm the current value from the source at audit time; don't rely on training memory for "the latest version".
- **Deterministic first.** Don't web-research a skill the pre-filter didn't flag - say it was skipped as fresh. Budget goes to candidates only.
- **Don't confirm by consensus.** A panel of models agreeing is not evidence; the vendor's docs are.
- **Decompose compound claims.** One verdict per atomic assertion.
- **Preserve voice + structure.** Update the stale fact, not the skill's whole style. Minimal diffs.

## Avoid (over-engineering)

- Building a standing CI job / cron / git-hook harness - this is an on-demand audit. (Mention CI only if the user asks to enforce it.)
- Re-verifying every skill every run - the TTL + ground-truth pre-filter exists to prevent that.
- A bespoke embeddings/SCIP symbol-graph - prose version-pin grep against `package.json` is enough here.
- Auto-applying "safe-looking" bumps - all changes are human-gated, full stop.

## See also
- `references/report-template.md` - the report + per-claim verdict format
- `/research` - the research step this skill delegates to (single source of truth for verification)
- `/audit-documentation` - sibling audit for repo docs (this one targets the skill library)
