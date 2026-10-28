# App Template Kit

Everything for building an app with Claude Code, start to finish:

- **[The playbook](PLAYBOOK.md)** ([PDF](docs/app-playbook.pdf)): each part of an app (design, database,
  auth, APIs, testing, errors, loading, monitoring, security, release), what good looks like, and which
  skill builds or checks it.
- **[The skills](skills/)**: Claude Code skills that build each part (`setup-*`) and check it (`audit-*`).
- **A template browser**: run four open-source admin templates and the Latent UI gallery side by side
  before you pick one.

## Start

**1. Install the skills** (once, for every project):

```bash
npx skills add stevetowers08/app-template-kit -g -a claude-code
```

Or clone this repo and run `npm run skills:install`, which also installs the `audit-repo` agent.

**2. Open your app's repo in Claude Code and say:**

> Read https://github.com/stevetowers08/app-template-kit/blob/main/PLAYBOOK.md and take me through part 1.

Or run a skill yourself, e.g. `/setup-new-repo`. The [map](PLAYBOOK.md#the-map) shows which skill
belongs to which part.

**3. Keep them current:**

```bash
npx skills update -g        # if you installed with npx skills
/update-skills              # inside Claude Code, if you cloned this repo
```

## Browse the templates

```bash
npm run clone     # first time: clones the templates into templates/
npm start         # http://localhost:3300
```

Pick an app from the select at the top. It installs on first open, starts, and shows in the frame.
One runs at a time.

| Template | Stack | Source |
|---|---|---|
| Studio Admin | Next.js 16, shadcn on Base UI | [arhamkhnz/next-shadcn-admin-dashboard-baseui](https://github.com/arhamkhnz/next-shadcn-admin-dashboard-baseui) |
| Shadcn Admin | Vite, shadcn | [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin) |
| Atomic CRM | React, shadcn, Supabase (demo mode) | [marmelab/atomic-crm](https://github.com/marmelab/atomic-crm) |
| Kiranism Dashboard | Next.js, shadcn, Clerk | [Kiranism/next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) |
| Latent UI | Next.js, shadcn on Base UI | in this repo (`latent-ui/`) |

**Latent UI** is a gallery of dashboard surfaces (card headers, stat cards, tables, lists) under five
looks. Pick a look, press **Use this** on a variant, then **Copy recipe** and paste it into Claude Code
in your app. Each template keeps its own licence; nothing is vendored here. Needs Node 20+ and git.

## Notes

- Some skills mention "the vault" or `<knowledge-base>/` paths. Those are the author's private notes.
  Skip those lines; the steps work without them, and the playbook holds the public version.
- PLAYBOOK.md is the source. The PDF is built from it with `npm run pdf`.
- Maintaining the skills (publishing edits from your own library) is in [AGENTS.md](AGENTS.md#publishing-skills).

## Licence

MIT, see [LICENSE](LICENSE). The templates it clones are not covered by it.
