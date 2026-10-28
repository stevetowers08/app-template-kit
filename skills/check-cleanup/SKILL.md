---
name: check-cleanup
description: Scan the project for stale, orphaned, and unnecessary files - old/squashable migrations, screenshots & test artefacts, completed PRDs/session-doc junk, unused scripts, un-gitignored build caches, dead-code files, and committed/duplicate env files - and report them with reclaimable space. Report-only by default; removes only with explicit confirmation (git rm for tracked files). Use when the user wants to clean up / declutter the repo, find stale or dead files, reclaim space, or check what's safe to delete.
disable-model-invocation: true
argument-hint: "[--remove]"
allowed-tools: Bash, Read, Glob, Grep
last_verified: 2026-08-21
---

# check-cleanup

Scan for stale/orphaned files and report them grouped by safety, with sizes. **Report only by default**
- never delete without explicit per-group confirmation (use `git rm` for tracked files so history is
  preserved). The `check-` (operational pass) tier.

> When to use: "clean up the repo", "find stale/dead files", "what can I delete", "reclaim space". For
> docs-structure cleanup specifically, use `/audit-documentation` (it owns docs restructure + archive).

## Scan (report everything; delete nothing yet)

1. **Migrations** - `ls supabase/migrations | wc -l`; flag total (>30 → suggest squashing old applied ones).
2. **Screenshots & test artefacts** - `*.png/jpg` outside node_modules; `test-results/`,
   `playwright-report/`, `.playwright-mcp/`, `coverage/`, `.nyc_output/` with `du -sh`. Usually safe;
   should be gitignored. Tracked images need `git rm`.
3. **Session-doc junk** - `*.md` outside node_modules excluding README/CLAUDE/AGENTS; root one-off
   `*.sql`/`*.html`. Flag implementation summaries, audit reports, finished plan docs as archive/delete
   candidates; distinguish from genuine reference docs.
4. **Unused scripts** - standalone `*.sh/*.mjs/*.cjs/*.py` not under `src/`; cross-check against
   `package.json` scripts + `.github/`. Flag unreferenced `debug-*`/`check_*`/`test_*`/`probe-*` one-offs.
5. **Build caches** - `.next/ out/ dist/ build/ .turbo/ .cache/ .vercel/` - `du -sh` + `git check-ignore`;
   flag any that exist and AREN'T gitignored.
6. **Dead-code files** - components/modules grepped for imports project-wide with zero references
   (verify before deleting - dynamic imports/string refs can fool grep). Near-empty files.
7. **Env clutter** - `.env*` tracked by git (**security risk** - flag CRITICAL), and stale duplicates
   (`.env.old`, `.env.backup`).

## Report
```
## Cleanup scan - <project>
### Safe to delete (no code refs)   - file/dir · size · reason
### Archive candidates (completed work) - file · why it looks done
### Should be gitignored            - file/dir · size
### Potential dead code (VERIFY)    - file · not imported anywhere
### Security                        - .env tracked by git (rotate + git rm --cached)
### Migration health                - total N · oldest <date> · squash if >30
### Reclaimable space               - artefacts Xmb · caches Xmb · stale Xmb
```

## Removing (only after the user confirms, or with `--remove` + per-group confirmation)
- Tracked files: `git rm` (preserves history); untracked: `rm`. Confirm each group separately.
- Add the right entries to `.gitignore` for the build-cache/artefact groups.
- Re-run `npm run build` after removing scripts/dead code to confirm nothing broke.

## Rules
- **Never delete without confirmation.** Dead-code detection is grep-based - a zero-reference file may
  be loaded dynamically or by string; always verify before removing.
- Distinguish session artefacts from genuine reference docs - when unsure, archive, don't delete.
- `.env` in git is the highest-severity finding (rotate the secret, then `git rm --cached`).
- Don't touch `node_modules/`, `.git/`, or anything the project's `.gitignore` already handles.

## See also
- `/audit-documentation` - owns the docs/ restructure + archive (this skill does file-level removal)
