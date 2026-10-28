---
name: update-skills
description: Keep the app-building skills current. Installs or updates the skills shipped in the app-template-kit repo into ~/.claude/skills (or a project's .claude/skills), checks them for stale versions and APIs via /audit-skill-freshness, and, for the repo maintainer, publishes edited skills back into the kit with private details stripped. Use when asked to install, update, refresh, sync or publish skills, "are my skills out of date", "get the latest skills", or right after editing a skill the kit ships.
disable-model-invocation: true
argument-hint: "[install | check | publish] [skill names, comma separated]"
allowed-tools: Bash, Read, Edit, Glob, Grep, Skill, AskUserQuestion
---

# update-skills

Three jobs, one per argument. No argument means `install`, unless you are the maintainer (step 0).

```
install  -> pull the kit, show what would change, copy new and updated skills in
check    -> /audit-skill-freshness: find guidance that has gone stale, propose cited fixes
publish  -> maintainer only: copy your edited skills into the kit, scrubbed, then commit
```

## Step 0 - Find the kit, and who you are

1. Locate the kit: `$APP_TEMPLATE_KIT` if set, else look for a checkout named `app-template-kit`
   under the usual code folders. None found: ask where to clone it, then
   `git clone https://github.com/stevetowers08/app-template-kit`.
2. Read its `skills.json`. That file is the list of what the kit publishes.
3. **Maintainer test.** If `~/.claude/skills-publish.json` exists, this machine's
   `~/.claude/skills` is the *source* the kit is built from. On a maintainer machine never run
   `install --force`: it would replace the full private versions with the public copies.
   Default to `publish` there instead.

## install

1. `git -C <kit> status --short`. Dirty: say so and stop; do not stash or reset. Clean:
   `git -C <kit> pull --ff-only`.
2. `npm run skills:status` in the kit (add `-- --project` to target the current repo's
   `.claude/skills` instead of `~/.claude/skills`). Show the user the table as printed.
3. `npm run skills:install`. It adds new skills and skips identical ones. A skill marked
   `keep (yours differs)` has local edits: show the diff
   (`git diff --no-index <installed> <kit>/skills/<name>`) and ask before replacing it with
   `npm run skills:install -- --only <name> --force`. Never pass `--force` without `--only`.
4. Report: added, updated, kept, and that a new Claude Code session picks them up.

## check

Run `/audit-skill-freshness` over the installed skills (or the names given). It proposes cited
fixes and edits nothing without approval. Approved edits go into the **source** skill (the
maintainer's `~/.claude/skills/<name>`), then `publish`. Editing the kit copy directly is
overwritten by the next publish.

## publish (maintainer)

1. A new skill to ship? Add its name to `skills.json` -> `skills`, and give it a row in
   `PLAYBOOK.md` (its part of the app, when to run it).
2. `npm run skills:sync -- --dry`. It stages every listed skill, strips private details, then
   scans for anything private left. Public rules (`dropBlocks`, `leakPatterns`) are in the kit's
   `skills.json`; private rules (`replace`, `replaceIn`, `denyPatterns`) are in
   `~/.claude/skills-publish.json`, which never goes in the kit.
3. **Refused?** Each leak line names the file, line and pattern. Fix it by adding a precise
   `replaceIn` rule to the private file, or by rewording the source. Never delete or loosen a
   leak or deny pattern to get a sync through; ask the user if a hit looks like a false positive.
4. Clean: `npm run skills:sync`, then `git -C <kit> diff --stat` and read the diff of every
   changed skill before committing.
5. If `PLAYBOOK.md` changed, `npm run bible` to rebuild the PDF.
6. Commit with explicit paths (`git commit --only -- skills/<name> skills.json ...`), message
   `chore(skills): sync <names>`. Push only when the user asks.

## Rules

- `sync` never deletes a skill from the kit. A name dropped from `skills.json` is reported as
  stray; removing it is a separate, confirmed step.
- Third-party skills (shadcn, supabase, vercel-labs and others listed in `PLAYBOOK.md`) are not
  copied into the kit. Update those from their own source: `npx skills update` or the install
  command in the playbook.
