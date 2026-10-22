# App Template Kit

Two things that go together when you start a new app:

1. **A switcher** that runs four open-source admin templates one at a time, in one window, so you
   can look at them side by side before picking one.
2. **Claude Code setup skills** that scaffold the repo you build from that pick - agent docs, a
   design system, tests, error handling, motion, Sentry.

## 1. Browse the templates

```bash
npm run clone     # git clone --depth 1 of each template in catalog.mjs
npm start         # http://localhost:3300
```

Pick an app from the select at the top. It installs on first open (using the package manager its
lockfile names), starts its own dev server, and shows in the frame below. Only one app runs at a
time - switching stops the previous one. The templates land in `templates/`, which is gitignored.

Already have the clones somewhere? Point at them instead:

```bash
TEMPLATES_DIR=/path/to/your/templates npm start
```

| Template | Stack | Source |
|---|---|---|
| Studio Admin | Next.js 16, shadcn on Base UI | [arhamkhnz/next-shadcn-admin-dashboard-baseui](https://github.com/arhamkhnz/next-shadcn-admin-dashboard-baseui) |
| Shadcn Admin | Vite, shadcn | [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin) |
| Atomic CRM | React, shadcn, Supabase (demo mode) | [marmelab/atomic-crm](https://github.com/marmelab/atomic-crm) |
| Kiranism Dashboard | Next.js, shadcn, Clerk | [Kiranism/next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) |

Each template is its own project under its own licence. Nothing is vendored here - the switcher
only clones and runs them. To add one: add an entry to `catalog.mjs` with its `repo` URL.

Requirements: Node 20+, git. Next.js and Vite apps start without a `dev` entry; anything else
needs one in `catalog.mjs`.

## 2. The setup skills

`skills/` holds seven [Claude Code](https://claude.com/claude-code) skills that scaffold a repo
once you have picked a template. Copy the ones you want into `~/.claude/skills/` (available in
every project) or `.claude/skills/` (that repo only), then invoke by name, e.g. `/setup-new-repo`.

| Skill | What it writes |
|---|---|
| `setup-new-repo` | `AGENTS.md` stating conventions it confirmed, a `verify` command built only from commands it ran, one commit. `--full` adds the docs architecture |
| `setup-design-system` | `docs/design/design.md` + `components.md` from the tokens and components actually in the repo |
| `setup-testing` | Test layers, config and a coverage stance that matches the stack |
| `setup-error-handling` | `lib/errors.ts`, `withApiHandler`, `fetchWithRetry` - the expected-vs-unexpected spine |
| `setup-motion` | Motion primitives: easing, duration, stagger, reduced-motion |
| `setup-landing-page-mockup` | A product mockup for a landing page, built from the app's own tokens |
| `setup-sentry` | `@sentry/nextjs` wiring for Next.js, 2026 file layout |

They are written to ask before overwriting, and to scaffold what a repo has earned rather than
every file a generator could produce.

**One caveat, stated plainly:** these skills grew inside a private knowledge base, and some lines
still point at "the vault" for the reasoning behind a rule. Those pointers resolve to nothing
here. The instructions themselves are self-contained; treat a vault reference as a footnote you
cannot open, not a missing step.

## Licence

MIT - see [LICENSE](LICENSE). The templates it clones are not covered by it.
