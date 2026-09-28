# Template Switcher

Browse the app templates cloned into `C:/dev/templates/` in one window. Pick an app from the
select at the top and it starts with its own dev server and shows below. Only one app runs at
a time; switching stops the previous one.

```bash
npm start   # http://localhost:3300
```

- The list is `catalog.mjs`: the full admin and dashboard apps first, then every Base UI build
  in the Square UI clone (single screens, read from its README table).
- To add a repo: `git clone --depth 1 <url> ../<name>`, then add an entry to `catalog.mjs`.
  Next.js and Vite apps start without a `dev` entry; set `path` if the root is a landing page.
- An app without `node_modules` installs on first open, using the package manager its
  lockfile names (pnpm, bun or npm). No lockfile fails rather than guessing.
- Each app gets a fixed port from 3301 upwards, in catalog order.
- An app that needs keys (Kiranism needs Clerk) fails with the dev server's own error shown.

**Licence:** Square UI allows its templates in client projects, but not republishing them or
folding them into our own template collection or registry. Keep this local. The other repos
are MIT.
