# Latent UI

Pick how a client app looks, then hand Claude Code the exact components.

1. `npm install` then `npm run dev` and open http://localhost:3210.
2. Choose a **look** in the top bar (Neutral, Linear, Vercel, Stripe, Notion). It sets
   colours, font, radius and elevation.
3. Open each surface (card headers, stat cards, tables, lists) and press **Use this** on
   the variant you want.
4. Press **Copy recipe** and paste it into Claude Code in the new app. The recipe names
   `@latent/*` registry items, so the new app gets the exact code.

While the registry is not deployed, the new app installs from this dev server, so keep
`npm run dev` running here.

Variant comments cite where a pattern came from ("the ops dashboard", "the tours analytics
app") and sometimes "the vault", a private knowledge base. Those are footnotes on the
reasoning, not steps you need; the components stand on their own.

## Licence

MIT - see [LICENSE](LICENSE).

Contributor rules, file map and commands: [AGENTS.md](AGENTS.md).
Design contract: [docs/design/design.md](docs/design/design.md).
