# Template Switcher

Browse the 20 free Square UI app templates in one window. Pick an app on the left (or use the
arrow keys) and it starts with `next dev` and shows on the right. Only one app runs at a time;
switching stops the previous one.

```bash
npm start   # http://localhost:3300
```

- Apps come from `../square-ui/templates-baseui/` (the Base UI builds). Clone it first:
  `git clone --depth 1 https://github.com/ln-dev7/square-ui.git ../square-ui`.
- Names, descriptions and hosted demo links are read from the Square UI README table.
- An app without `node_modules` runs `pnpm install` the first time you open it.
- Each app gets a fixed port from 3301 upwards, in alphabetical order.

**Licence:** Square UI allows these templates in client projects, but not republishing them
or folding them into our own template collection or registry. Keep this local.
