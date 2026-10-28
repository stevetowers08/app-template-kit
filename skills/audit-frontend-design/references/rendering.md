# audit-frontend-design - rendering recipe

Goal: get the app running and capture real screenshots of each target route at desktop + mobile, so the
FD1-FD7 critique grades pixels, not JSX.

## 1. Find how the app runs

- Read `package.json` scripts. Common: `npm run dev`. This repo family often has multiple apps on fixed
  ports (e.g. Vite entrypoints) - check the project CLAUDE.md for the right port/app before assuming.
- If a dev server is **already up**, reuse it - probe the likely port(s) with a quick `curl -sf
  http://127.0.0.1:<port>` before launching a second one.
- If not, start it in the background (`run_in_background: true`), then poll the port until it answers.
  Do not block the foreground on a long-running server.

## 2. Capture with Playwright MCP

Prefer the persistent CDP Chrome if the environment uses it (see user CLAUDE.md "Browser Automation");
otherwise the plugin Playwright server is fine. Per target route:

1. `browser_resize` to **1440 x 900**, `browser_navigate` to the route, `browser_wait_for` the main
   content (or a short settle), then `browser_take_screenshot` (full page) to the scratchpad.

> This is **evaluative** screenshotting (render → critique the look), NOT `toHaveScreenshot` baseline
> regression. Capture retina-accurate pixels (device scale) and let animations settle before the shot
> so a mid-transition frame doesn't skew FD1/FD4.
2. `browser_resize` to **390 x 844** (mobile), reload/navigate, screenshot again.
3. For FD6, trigger a representative interaction (hover a primary button, open a menu, scroll a hero
   into view) and observe/console-check; a still frame can't show easing.

Save shots to the session scratchpad with clear names, e.g.
`<scratchpad>/afd-<route-slug>-<1440|390>.png`, and cite those paths as evidence in findings.

## 3. When the app will not launch

- Do NOT fabricate a visual read. Mark the run `static-fallback` in the report header and drop
  confidence on every perceptual dimension.
- Static fallback = read the page's JSX + its CSS/Tailwind classes and the design tokens to reason about
  likely hierarchy/spacing/typography, explicitly labelled as inferred-not-observed. FD6 can still be
  graded from the transition/animation code. FD1/FD4 (which need real pixels) should be marked low
  confidence or SKIPPED.

## 4. Notes

- Screenshot the states that matter: loaded (not loading), and an empty/error state if reachable -
  those reveal FD7d polish gaps.
- If auth gates the app, capture what's reachable (landing, login) and note the gated routes as Skipped
  rather than guessing.
- Keep total shots reasonable (3-6 routes x 2 breakpoints); this is a spot-check audit, not a full crawl.
