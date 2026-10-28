---
name: update-skills
description: Monthly upkeep for Claude Code skills. Updates installed skills to their latest versions, runs /audit-skill-freshness to catch advice that has gone out of date, and can set up a monthly scheduled update. For the app-template-kit maintainer it also publishes edited skills into the kit. Use when asked to update or refresh skills, "are my skills out of date", a monthly skill check, scheduling skill updates, or publishing skills.
disable-model-invocation: true
argument-hint: "[update | check | schedule | publish]"
allowed-tools: Bash, Read, Edit, Glob, Grep, Skill, AskUserQuestion
---

# update-skills

Run it once a month. No argument runs `update`, then `check`.

**Maintainer machine:** if `~/.claude/skills-publish.json` exists, `~/.claude/skills` is the source
app-template-kit is built from. Never overwrite those skills with the kit's copies; use `publish`.

## update

1. `npx skills check`. Show the user which skills have newer versions.
2. `npx skills update -g -y` for skills installed for every project. For a project install, run
   `npx skills update -p -y` in that repo.
3. Installed from a clone of app-template-kit instead? In the clone: `git pull --ff-only` (dirty
   tree: say so and stop), then `npm run skills:install`. A skill shown as `keep (yours differs)`
   has local edits: show the diff and ask before `npm run skills:install -- --only <name> --force`.
4. Say what changed. Updated skills load in the next Claude Code session.

## check

Run `/audit-skill-freshness`. It finds skills whose versions, settings or APIs have moved on,
checks each against official docs, and proposes cited fixes. Nothing is edited without a yes.
Fix the user's own skills directly. For someone else's skill, report it to its repo or wait for
their update.

## schedule

Sets a monthly automatic update. Ask first, show the exact command, create it only on a yes.

- Windows: `schtasks /create /tn "Update Claude skills" /sc monthly /d 1 /st 09:00 /tr "cmd /c npx skills update -g -y"`
- macOS or Linux: add `0 9 1 * * npx skills update -g -y` with `crontab -e`.

Then run it once (`schtasks /run /tn "Update Claude skills"`, or the command by hand) and confirm
it worked: a scheduled task may not see `npx` on its PATH. The `check` step needs a person to
approve fixes, so it stays a monthly manual run; suggest a calendar reminder.

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
