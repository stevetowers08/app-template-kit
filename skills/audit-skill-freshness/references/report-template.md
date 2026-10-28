# audit-skill-freshness - report + verdict format

Write the report to the scratchpad (don't edit skills until the user approves items from it).

## Per-claim verdicts (the vocabulary)

| Verdict | Meaning | Action |
|---|---|---|
| `current` | Claim still matches the primary source | none |
| `outdated` | Source shows a newer value/version; claim is behind | propose update (with URL) |
| `refuted` | Claim is now wrong (API removed/renamed, default changed) | propose fix (with URL) |
| `unverifiable` | No primary source found, or only blog-tier/uncertain evidence | **flag for human** - do NOT propose a change |

A claim only becomes a proposed edit if it's `outdated` or `refuted` **and** carries a primary-source URL
(vendor docs, changelog, release notes). Everything else stays a flag.

## Report structure

ALWAYS use this layout:

```markdown
# Skill Freshness Audit - <date>

Scope: <glob/targets>  ·  Checked: <n>  ·  Candidates researched: <m>  ·  Skipped as fresh: <k>

## Summary
| Skill | Pinned tech | Last verified | Status | Drifted claims | Top action |
|---|---|---|---|---|---|
| setup-sentry | @sentry/nextjs v10, Next 16 | 2026-03-01 | outdated | 1 | bump SDK note to v… |
| setup-testing | Vitest 4, Playwright | (none) | current | 0 | stamp last_verified |
| ...

Status = current (no drift) · stale (TTL lapsed, not yet researched) · outdated (confirmed drift).

## Confirmed drift (proposed edits - need approval)
### <skill-name>
- **Claim:** "<atomic claim as written in the skill>"
- **Verdict:** outdated | refuted
- **Now:** <current value from the source>
- **Source:** <primary URL> (re-fetched <date>)
- **Confidence:** high | medium
- **Proposed edit:** <exact old → new, file + location>

## Needs human eyes (unverifiable)
- <skill>: "<claim>" - <why no confident verdict: no primary source / conflicting / uncertain>

## Skipped as fresh (no deterministic flag)
- <skill> (last_verified <date>, pins match ground truth)
```

## Notes
- Lead with the Summary table - it's the scannable answer.
- Keep `unverifiable` visible as its own section; never fold it into "nothing to do".
- After the user approves specific edits, apply them, stamp `last_verified: <date>` in each touched
  skill's frontmatter, and add a one-line source note beside the changed claim where it aids the next audit.
- Ground-truth version lookup: `grep` the skill's pins, then read the relevant `C:/Dev/**/package.json`,
  `.nvmrc`, or `.tool-versions` for what the user actually runs. A skill may legitimately pin a newer
  version than a given repo - drift is when the **skill** is behind the ecosystem/repos, not ahead.
```
