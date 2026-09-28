# Template Switcher

Browse the admin app templates cloned into `C:/dev/templates/` in one window. Pick an app from
the select at the top and it starts with its own dev server and shows below. Only one app runs
at a time; switching stops the previous one.

```bash
npm start   # http://localhost:3300
```

- The list is `catalog.mjs`. To add a repo: `git clone --depth 1 <url> ../<name>`, then add an
  entry. Next.js and Vite apps start without a `dev` entry; set `path` if the root is a
  landing page.
- An app without `node_modules` installs on first open, using the package manager its
  lockfile names (pnpm, bun or npm). No lockfile fails rather than guessing.
- Each app gets a fixed port from 3301 upwards, in catalog order.
- An app that needs keys (Kiranism needs Clerk) fails with the dev server's own error shown.
- Studio Admin is the Base UI edition, with extra theme presets imported from tweakcn and a
  Corner Rounding preference added (`npm run import:presets -- <names>` there adds more).
