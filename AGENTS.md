# AGENTS.md

Instructions for an AI agent working in or from this repo. What lives here:

| Path | What |
|---|---|
| `PLAYBOOK.md` | The main parts of an app, each with best practice, a build skill, a check skill and "done when". Source of `docs/app-playbook.pdf` |
| `skills/` | Published copies of the skills the playbook names |
| `server.mjs`, `catalog.mjs` | The template switcher |
| `latent-ui/` | A surface gallery and shadcn registry. Its own `AGENTS.md` governs work inside it |

## Taking a user through the playbook

When asked to "follow the playbook", "build this app properly", or "what's next for this app":

1. Read `PLAYBOOK.md`. Work out which part the user's app is on from what exists in their repo
   (no `AGENTS.md` = Setup; no `docs/design/` = Design; and so on). Say which part and why.
2. Do one part at a time. For that part: run the **Build**
   skill, then the **Check** skill, then confirm the **Done when** line with a command, not a claim.
3. Run skills one at a time, never as a batch. Each reads what the previous one left behind.
4. `supabase` is not in this kit. If it is missing, give the user the install command from
   "Getting the skills" and wait. Do not substitute your own version of it.
5. Unfamiliar tech or a "what do the pros do" question: run `/research <topic>` first.
6. Do not choose a template, a look or a vendor for the user. Show the options and what each costs.

## Commands

```bash
npm run skills:install     # copy skills/ into ~/.claude/skills (add -- --project for ./.claude)
npm run skills:status      # what install would change, writes nothing
npm run skills:sync        # maintainer only, see below
npm run pdf                # rebuild docs/app-playbook.pdf from PLAYBOOK.md
npm run clone && npm start # template switcher on http://localhost:3300
```

`skills:install` skips a skill the user has changed locally. Replace one only with
`-- --only <name> --force`, after showing the user the diff.

## The template switcher

| Call | Does |
|---|---|
| `GET /api/state` | What is running: app id, port, status (`installing`/`starting`/`ready`/`error`), last 40 log lines |
| `POST /api/start/<id>` | Starts that app (ids in `catalog.mjs`), stopping the current one. Returns at once; poll `/api/state` until `ready` |
| `POST /api/stop` | Stops everything |

`PORT` overrides 3300; apps get 3301 up. `TEMPLATES_DIR` points at existing clones. Latent UI run by
the switcher skips its registry build; for registry work run `cd latent-ui && npm run dev` (port 3210).

## Publishing skills

The skills in `skills/` are generated copies. The source is the maintainer's `~/.claude/skills`.

1. Edit the skill in `~/.claude/skills/<name>`, never in `skills/` (the next sync overwrites it).
2. New skill: add its name to `skills.json` and give it a place in the PLAYBOOK map. Keep it to
   one build and one check skill per part.
3. `npm run skills:sync -- --dry`. It strips private details and refuses if anything private is
   left. Public rules (`dropBlocks`, `leakPatterns`) are in `skills.json`. Private rules
   (`replace`, `replaceIn`, `denyPatterns`) are in `~/.claude/skills-publish.json`, which never
   enters this repo because the text it matches is the private text.
4. Refused: add a precise `replaceIn` rule to the private file, or reword the source. Never loosen
   a leak or deny pattern to get a sync through.
5. `npm run skills:sync`, read the diff, `npm run pdf` if PLAYBOOK.md changed, commit with explicit
   paths. Push only when asked.

Descriptions must be valid YAML: no unquoted `: ` inside them, or `npx skills` silently skips the skill.

## House rules

- Templates are other people's projects. Nothing is vendored or patched here.
- Add a template by adding an entry to `catalog.mjs` with its `repo` URL.
- `sync` never deletes a skill from `skills/`. Removing one is a separate, confirmed step.
