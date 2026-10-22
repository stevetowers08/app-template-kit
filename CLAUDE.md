# CLAUDE.md

Instructions for Claude Code working in this repo. Three things live here: a **switcher** that
runs admin templates one at a time, **latent-ui** (a surface gallery that ships in this repo),
and **skills/** - setup skills to copy into a new project.

## Running the switcher

```bash
npm run clone     # first time only: clones the templates in catalog.mjs into templates/
npm start         # http://localhost:3300
```

- `npm run clone` skips anything already cloned. It never pulls, resets or deletes.
- The templates land in `templates/` (gitignored). `TEMPLATES_DIR` points elsewhere if the user
  already has the clones.
- `PORT` overrides 3300. Each app gets its own port from 3301 up, in catalog order.
- Only one app runs at a time. Starting another stops the previous one.
- An app with no `node_modules` installs on first open, using the package manager its lockfile
  names, so the first start can take a minute. Nothing to do but wait.

## Switching apps

The switcher has a small HTTP API, so you do not need to click anything:

| Call | Does |
|---|---|
| `GET /api/state` | What is running: app id, port, status (`installing`/`starting`/`ready`/`error`), last 40 log lines |
| `POST /api/start/<id>` | Starts that app (ids are in `catalog.mjs`), stopping the current one |
| `POST /api/stop` | Stops everything |

`POST /api/start/<id>` returns immediately - the app is not up yet. Poll `GET /api/state` until
`status` is `ready`, and read `error` plus `log` if it turns `error`.

```bash
curl -s -X POST http://localhost:3300/api/start/studio-admin
curl -s http://localhost:3300/api/state
```

To show the user an app, open `http://localhost:3300` in the browser - the frame follows
whatever is running, and the select at the top is how **the user** switches. Drive the API when
you need a specific app up; let the user browse from the page. Do not pick a template for them:
show the options, say what each is good for, and let them choose.

## The skills

`skills/` holds seven Claude Code skills. They are not active from this repo - copy the ones a
project needs into that project's `.claude/skills/`, or into `~/.claude/skills/` to have them
everywhere. Then invoke by name (`/setup-new-repo`).

Rough order when standing up a new app, and the trigger for each:

| When | Skill |
|---|---|
| A repo exists (cloned template or empty) and an agent is about to work in it | `setup-new-repo` - AGENTS.md, a real `verify` command, one commit. Everything else is earned later |
| Tokens and components are actually on disk, not before | `setup-design-system` - writes `docs/design/` from what the repo really has |
| The first API route or data fetch | `setup-error-handling` - `lib/errors.ts`, `withApiHandler`, `fetchWithRetry` |
| There is behaviour worth protecting | `setup-testing` - layers, config, a coverage stance |
| The UI is built and feels static | `setup-motion` - easing, duration, stagger, reduced-motion |
| A landing page needs a product shot | `setup-landing-page-mockup` - a mockup from the app's own tokens |
| Before the app goes in front of anyone | `setup-sentry` - `@sentry/nextjs`, 2026 file layout. Ask for the org, project and region |

Each skill asks before overwriting. Run them one at a time, in the order above, not as a batch -
each one reads what the previous left behind.

## latent-ui

`latent-ui/` is a Next.js gallery of dashboard surfaces (card headers, stat cards, tables,
lists), each in several variants under five looks. The user picks a variant per surface and
copies a recipe naming `@latent/*` registry items into a new app.

The switcher runs it like any other app (`POST /api/start/latent-ui`), but it starts `next dev`
directly, which skips the `predev` registry build. For anything touching the registry itself,
run it on its own instead - `cd latent-ui && npm run dev` (port 3210), which rebuilds the
registry first. Its own `CLAUDE.md` and `AGENTS.md` govern work inside that folder.

## House rules

- Add a template by adding an entry to `catalog.mjs` with its `repo` URL. Next.js and Vite apps
  need no `dev` command; anything else does.
- The cloned templates are other people's projects under their own licences. Nothing is vendored
  and nothing is patched here - read them, copy from them, but change them in the new repo.
- Skills in `skills/` are copies. Edit the source in `~/.claude/skills/` and copy over, or the
  two drift apart silently.
