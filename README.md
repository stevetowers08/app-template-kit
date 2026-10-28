# App Template Kit

Build an app with Claude Code, part by part.

- **[The playbook](PLAYBOOK.md)** ([PDF](docs/app-playbook.pdf)): the main parts of an app (design,
  data and auth, APIs, error handling, loading, testing, security, monitoring, launch), what good
  looks like in each, and the skill that builds it and the skill that checks it.
- **[The skills](skills/)** the playbook uses.
- **A template browser** for comparing open-source admin templates before you start.

## Start

Install the skills, for every project:

```bash
npx skills add stevetowers08/app-template-kit -g -a claude-code
```

Then open your app in Claude Code and say:

> Read https://github.com/stevetowers08/app-template-kit/blob/main/PLAYBOOK.md and take me through Setup.

Keep them current with `npx skills update -g`, or `/update-skills` inside Claude Code.

## Browse the templates

```bash
npm run clone     # first time: clones the templates into templates/
npm start         # http://localhost:3300
```

Pick one from the select at the top. It installs, starts and shows in the frame. One runs at a time.

| Template | Stack | Source |
|---|---|---|
| Studio Admin | Next.js, shadcn on Base UI | [arhamkhnz/next-shadcn-admin-dashboard-baseui](https://github.com/arhamkhnz/next-shadcn-admin-dashboard-baseui) |
| Shadcn Admin | Vite, shadcn | [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin) |
| Atomic CRM | React, shadcn, Supabase | [marmelab/atomic-crm](https://github.com/marmelab/atomic-crm) |
| Kiranism Dashboard | Next.js, shadcn, Clerk | [Kiranism/next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) |
| Latent UI | Next.js, shadcn on Base UI | in this repo (`latent-ui/`) |

Each template keeps its own licence. Needs Node 20+ and git.

## Notes

- Some skills mention "the vault" or `<knowledge-base>/`. That is the author's private notes;
  skip those lines.
- The PDF is built from PLAYBOOK.md with `npm run pdf`.
- Maintaining the skills: [AGENTS.md](AGENTS.md#publishing-skills).

## Licence

MIT, see [LICENSE](LICENSE). The templates it clones are not covered by it.
