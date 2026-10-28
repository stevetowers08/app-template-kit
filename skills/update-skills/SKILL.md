---
name: update-skills
description: Keep the app playbook skills up to date. Updates the installed skills from the app-template-kit repo, and for the repo maintainer, publishes edited skills back into the kit with private details removed. Use when asked to update, refresh, install or publish skills, "are my skills out of date", or right after editing a skill the kit ships.
disable-model-invocation: true
argument-hint: "[update | publish]"
allowed-tools: Bash, Read, Edit, Glob, Grep, AskUserQuestion
---

# update-skills

Two jobs. No argument means `update`, unless this is the maintainer's machine: if
`~/.claude/skills-publish.json` exists, `~/.claude/skills` is the source the kit is built from, so
default to `publish` and never overwrite those skills with the kit's copies.

## update

1. Installed with `npx skills`? Run `npx skills check`, show the result, then `npx skills update -g`.
2. Installed from a clone of the kit? `git pull --ff-only` in it (dirty tree: say so and stop),
   then `npm run skills:status` and `npm run skills:install`.
   A skill shown as `keep (yours differs)` has local edits. Show the diff and ask before
   `npm run skills:install -- --only <name> --force`.
3. Say what changed. New skills load in the next Claude Code session.

## publish (maintainer)

1. Edit the skill in `~/.claude/skills/<name>`, never the kit copy (the next publish overwrites it).
   A new skill also needs its name in the kit's `skills.json` and a place in `PLAYBOOK.md`.
2. In the kit: `npm run skills:sync -- --dry`. It removes private details using the kit's
   `skills.json` and the local `~/.claude/skills-publish.json`, then refuses if anything private
   is left.
3. Refused: each line names the file, line and pattern. Add a precise `replaceIn` rule to the
   local file or reword the source. Never loosen a pattern to get it through.
4. `npm run skills:sync`, read the diff, `npm run pdf` if `PLAYBOOK.md` changed, commit with
   explicit paths. Push only when the user asks.
