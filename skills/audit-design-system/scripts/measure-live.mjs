#!/usr/bin/env node
// Measure what actually renders: icon sizes and card surfaces on live pages, by
// computed style in a real browser. Read-only: navigates and clicks tabs, never
// submits anything but the login form. Never prints credentials.
//
//   node measure-live.mjs --root <repo> --base http://localhost:3000 --paths "/,/leads/<id>" [--tabs]
//        [--scale 12,16,28] [--out ./design-measure] [--wait 6000] [--viewport 1440x900]
//        [--chrome-top 56] [--chrome-left 56]
//   auth (only if a login form appears), one of:
//        --storage-state <playwright storageState.json>
//        --env-file .env.local [--email-var E2E_USER_EMAIL] [--password-var E2E_USER_PASSWORD] [--submit "Sign in"]
//   Git Bash rewrites arguments that start with "/": prefix the command with MSYS_NO_PATHCONV=1.
//
// Use a TEST account (the repo's e2e user). Never type a person's credentials and never
// bypass a browser launcher that refuses to start because a profile holds saved passwords.
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]?.startsWith("--") ? "true" : all[i + 1] ?? "true"]] : acc), []),
);
const ROOT = resolve(args.root ?? ".");
const BASE = (args.base ?? "http://localhost:3000").replace(/\/$/, "");
const PATHS = (args.paths ?? "/").split(",").map((p) => p.trim()).filter(Boolean).map((p) => {
  // Git Bash (MSYS) rewrites a leading "/" into "C:/Program Files/Git/...".
  if (/^[A-Za-z]:[\\/]/.test(p)) throw new Error(`"${p}" was rewritten by the shell: run with MSYS_NO_PATHCONV=1, or drop the leading slash`);
  return p.startsWith("/") ? p : `/${p}`;
});
const SCALE = args.scale ? args.scale.split(",").map(Number) : null;
const OUT = resolve(args.out ?? "design-measure");
const WAIT = Number(args.wait ?? 6000);
const [VW, VH] = (args.viewport ?? "1440x900").split("x").map(Number);
const TOP = Number(args["chrome-top"] ?? 56), LEFT = Number(args["chrome-left"] ?? 56);
mkdirSync(OUT, { recursive: true });

const require = createRequire(resolve(ROOT, "package.json"));
const { chromium } = require("@playwright/test");

// Runs in the page. Icons: square svgs on a known icon grid. Cards: rounded, >=120x40,
// bordered / painted / shadowed, not a control.
const collect = ({ top, left }) => {
  const region = (r) => (r.top < top ? "appbar" : r.left < left ? "rail" : "content");
  const icons = [];
  for (const s of document.querySelectorAll("svg")) {
    const vb = (s.getAttribute("viewBox") || "").split(/\s+/).map(Number);
    if (vb.length !== 4 || vb[2] !== vb[3] || ![12, 16, 20, 24, 32, 256].includes(vb[2])) continue;
    const r = s.getBoundingClientRect();
    if (!r.width || getComputedStyle(s).display === "none") continue;
    const host = s.closest("button, a, [role=tab], h1, h2, h3, li, p, div");
    icons.push({ px: Math.round(r.width), region: region(r), text: (host?.getAttribute("aria-label") || host?.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40) });
  }
  const CONTROL = "button, input, select, textarea, [role=tab], [role=combobox], [role=switch], [role=checkbox], [role=option], [role=menuitem]";
  const paintOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") return c; } return "rgb(255, 255, 255)"; };
  const cards = [];
  for (const el of document.querySelectorAll("body *")) {
    if (el.matches(CONTROL) || el.closest(CONTROL)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 120 || r.height < 40 || region(r) !== "content") continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
    const radius = parseFloat(cs.borderTopLeftRadius) || 0;
    if (radius < 4) continue;
    const bw = ["Top", "Right", "Bottom", "Left"].map((k) => parseFloat(cs[`border${k}Width`]) || 0);
    const framed = bw.every((w) => w > 0);
    // A shadow token set to transparent computes as layers of rgba(0,0,0,0): same as none.
    const shadow = cs.boxShadow === "none" || /^(rgba\(0, 0, 0, 0\)[^,]*,?\s*)+$/.test(cs.boxShadow) ? "" : cs.boxShadow;
    const painted = !["rgba(0, 0, 0, 0)", "transparent"].includes(cs.backgroundColor) && cs.backgroundColor !== paintOf(el.parentElement);
    if (!framed && !shadow && !painted) continue;
    cards.push({
      sig: [`r${Math.round(radius)}`, framed ? `border ${bw[0]}px ${cs.borderTopColor}` : "no border", `bg ${cs.backgroundColor}`, shadow ? `shadow ${shadow.split(/,(?![^(]*\))/).find((l) => !l.includes("rgba(0, 0, 0, 0)"))?.trim().slice(0, 48) ?? shadow.slice(0, 48)}` : "no shadow", `pad ${cs.paddingTop} ${cs.paddingLeft}`].join(" | "),
      text: (el.querySelector("h1,h2,h3,h4,p,span")?.textContent || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40),
      w: Math.round(r.width), h: Math.round(r.height),
    });
  }
  return { icons, cards };
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: VW, height: VH }, ...(args["storage-state"] ? { storageState: resolve(args["storage-state"]) } : {}) });
const page = await context.newPage();
page.setDefaultTimeout(180000);
const report = {};

// A visible password field means a login form, wherever the app redirected to. Measuring
// it by mistake is the silent failure this guards against.
const loginFormShowing = () => page.locator('input[type="password"]').first().isVisible().catch(() => false);
async function ensureLoggedIn() {
  if (!(await loginFormShowing())) return;
  if (!args["env-file"]) throw new Error(`a login form is showing at ${page.url()} - pass --storage-state, or --env-file with the test account's variables`);
  const want = [args["email-var"] ?? "E2E_USER_EMAIL", args["password-var"] ?? "E2E_USER_PASSWORD"];
  const env = Object.fromEntries(readFileSync(resolve(args["env-file"]), "utf8").split("\n").map((l) => l.replace(/\r$/, ""))
    .filter((l) => want.some((k) => l.startsWith(`${k}=`)))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^["']|["']$/g, "")]));
  if (!env[want[0]] || !env[want[1]]) throw new Error(`${want.join("/")} missing from ${args["env-file"]}`);
  await page.getByLabel(/email/i).fill(env[want[0]]);
  await page.getByLabel(/password/i).fill(env[want[1]]);
  await page.getByRole("button", { name: args.submit ?? "Sign in", exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('input[type="password"]'), null, { timeout: 120000 }).catch(() => {});
  if (await loginFormShowing()) throw new Error("still on a login form after submitting - wrong test credentials, or an auth rate limit");
}

const hist = (xs) => Object.fromEntries(Object.entries(xs.reduce((m, x) => ((m[x] = (m[x] ?? 0) + 1), m), {})).sort((a, b) => Number(a[0]) - Number(b[0])));
async function measure(label) {
  const { icons, cards } = await page.evaluate(collect, { top: TOP, left: LEFT });
  const content = icons.filter((i) => i.region === "content");
  report[label] = {
    iconsContent: hist(content.map((i) => i.px)),
    iconsChrome: hist(icons.filter((i) => i.region !== "content").map((i) => i.px)),
    offScale: SCALE ? content.filter((i) => !SCALE.includes(i.px)).map((i) => `${i.px}px "${i.text}"`) : [],
    cards,
  };
  await page.screenshot({ path: join(OUT, `${label.replace(/[^\w-]+/g, "_").slice(0, 80)}.png`), fullPage: true });
}

try {
  for (const path of PATHS) {
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await ensureLoggedIn();
    if (!page.url().includes(path.split("?")[0])) await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(WAIT);
    const tabs = args.tabs ? await page.getByRole("tab").allInnerTexts() : [];
    if (!tabs.length) { await measure(path); continue; }
    for (const raw of tabs) {
      const name = raw.replace(/\s*\d+\s*$/, "").trim();
      await page.getByRole("tab", { name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }).first().click();
      await page.waitForTimeout(Math.min(WAIT, 3500));
      await measure(`${path} [${name}]`);
    }
  }
} finally {
  writeFileSync(join(OUT, "measure.json"), JSON.stringify(report, null, 1));
  await browser.close();
}

const groups = new Map();
for (const [label, r] of Object.entries(report)) {
  console.log(`${label.padEnd(34)} icons content ${JSON.stringify(r.iconsContent)} | chrome ${JSON.stringify(r.iconsChrome)}`);
  for (const o of r.offScale.slice(0, 8)) console.log(`    off-scale: ${o}`);
  for (const c of r.cards) { const g = groups.get(c.sig) ?? { n: 0, where: new Set(), eg: c.text }; g.n++; g.where.add(label); groups.set(c.sig, g); }
}
console.log(`\ncard surfaces: ${groups.size} computed-style signatures`);
for (const [sig, g] of [...groups].sort((a, b) => b[1].n - a[1].n)) console.log(`  ${String(g.n).padStart(3)}  ${sig}  e.g. "${g.eg}"  (${[...g.where].length} views)`);
console.log(`\nscreenshots + measure.json: ${OUT}`);
