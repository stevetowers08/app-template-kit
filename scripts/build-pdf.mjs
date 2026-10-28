// Renders PLAYBOOK.md to docs/app-playbook.pdf with headless Chrome or Edge.
// PLAYBOOK.md is the source; never edit the PDF by hand. Set CHROME=/path/to/browser if it is
// not found. PLAYBOOK_HTML=/some/file.html also writes the HTML, for previewing the layout.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { marked } from "marked";

const ROOT = join(import.meta.dirname, "..");
const REPO = "https://github.com/stevetowers08/app-template-kit";
const OUT = join(ROOT, "docs", "app-playbook.pdf");

const BROWSERS = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);
const browser = BROWSERS.find((p) => existsSync(p));
if (!browser) {
  console.error("No Chrome or Edge found. Set CHROME=/path/to/browser and run again.");
  process.exit(1);
}

// GitHub-style heading ids, so the playbook's own anchor links work in the PDF too.
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const inner = this.parser.parseInline(tokens);
      return `<h${depth} id="${slug(inner)}">${inner}</h${depth}>\n`;
    },
  },
});

const md = readFileSync(join(ROOT, "PLAYBOOK.md"), "utf8").replace(
  /\]\((README\.md|AGENTS\.md|skills\/[^)]*)\)/g,
  (_, p) => `](${REPO}/blob/main/${p})`,
);

let html = marked.parse(md);

// Skill names become chips; the kit's own link to their SKILL.md. Other code stays code.
const OUTSIDE_SKILLS = { supabase: "https://github.com/supabase/agent-skills" };
html = html.replace(/<code>([a-z][a-z0-9-]+)<\/code>/g, (m, name) => {
  if (existsSync(join(ROOT, "skills", name, "SKILL.md"))) {
    return `<a class="chip" href="${REPO}/blob/main/skills/${name}/SKILL.md">${name}</a>`;
  }
  return OUTSIDE_SKILLS[name] ? `<a class="chip" href="${OUTSIDE_SKILLS[name]}">${name}</a>` : m;
});

// Build / Check / Done when lines become one strip per part.
html = html.replace(
  /<p><strong>(Build|Check|Done when):<\/strong>\s*([\s\S]*?)<\/p>/g,
  (_, label, value) => `<div class="meta meta-${slug(label)}"><span class="label">${label}</span><span>${value}</span></div>`,
);
html = html.replace(/((?:<div class="meta[\s\S]*?<\/div>\s*)+)/g, '<div class="strip">$1</div>');

// The first table is the map.
html = html.replace("<table>", '<table class="map">');

// Wrap each part in a section so it never splits across pages.
const [intro, ...parts] = html.split(/(?=<h2 )/);
html = `<header class="cover">${intro}</header>` + parts.map((p) => `<section class="part">${p}</section>`).join("");

const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Building an App</title>
<style>
  :root {
    --ink: #17191c;
    --body: #3a3f45;
    --muted: #767c84;
    --line: #e4e6ea;
    --soft: #f5f6f8;
    --paper: #ffffff;
    --done: #2f7d5b;
  }
  @page { size: A4; margin: 18mm 18mm 20mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--paper); color: var(--body);
    font: 10pt/1.55 "Segoe UI Variable Text", "Segoe UI", -apple-system, "Helvetica Neue", Arial, sans-serif;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  a { color: inherit; text-decoration: none; }
  strong { color: var(--ink); font-weight: 600; }

  /* Cover: title, how to use, the map */
  .cover { break-after: page; }
  .cover h1 {
    font-size: 34pt; line-height: 1.05; letter-spacing: -0.02em; color: var(--ink);
    margin: 18mm 0 6mm; font-weight: 700;
  }
  .cover > p { font-size: 11pt; max-width: 150mm; margin: 0 0 4mm; }
  .cover > p:first-of-type { font-size: 13pt; color: var(--ink); margin-bottom: 8mm; }
  table.map { width: 100%; border-collapse: collapse; margin: 9mm 0 7mm; font-size: 10pt; }
  table.map th {
    text-align: left; font-size: 8pt; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--muted); padding: 0 0 3mm; border-bottom: 1.5px solid var(--ink);
  }
  table.map td { padding: 3mm 0; border-bottom: 1px solid var(--line); vertical-align: middle; }
  table.map td:first-child { font-weight: 600; color: var(--ink); width: 34%; }

  /* Chips: filled for build, outlined for check */
  .chip {
    display: inline-block; font: 500 8.6pt/1 "Cascadia Mono", Consolas, "SF Mono", Menlo, monospace;
    padding: 1.6mm 2.4mm; border-radius: 99px; border: 1px solid var(--line);
    background: var(--soft); color: var(--ink); white-space: nowrap;
  }
  table.map td:nth-child(2) .chip, .meta-build .chip { background: var(--ink); border-color: var(--ink); color: var(--paper); }
  table.map td:nth-child(3) .chip, .meta-check .chip { background: var(--paper); border-color: var(--ink); }

  /* Parts */
  .part { break-inside: avoid; padding: 7mm 0 6mm; border-top: 1px solid var(--line); }
  .cover + .part { border-top: 0; padding-top: 0; }
  h2 { font-size: 18pt; letter-spacing: -0.01em; color: var(--ink); margin: 0 0 1.5mm; font-weight: 700; }
  h2 + p { color: var(--muted); margin: 0 0 3.5mm; }
  ul { margin: 0 0 4.5mm; padding: 0; list-style: none; }
  li { position: relative; padding-left: 5mm; margin: 0 0 1.6mm; }
  li::before { content: ""; position: absolute; left: 0.6mm; top: 2.2mm; width: 1.6mm; height: 1.6mm; border-radius: 50%; background: var(--ink); }
  li code { font: 9pt Consolas, monospace; }

  .strip { display: flex; flex-wrap: wrap; gap: 3mm 8mm; align-items: center; padding: 3.5mm 4mm; background: var(--soft); border-radius: 3mm; }
  .meta { display: flex; align-items: center; gap: 2.5mm; }
  .label { font-size: 7.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
  .meta-done-when { flex-basis: 100%; color: var(--ink); }
  .meta-done-when .label { color: var(--done); }
  .meta-done-when .label::before { content: "\\2713  "; }

  pre { background: var(--soft); border-radius: 3mm; padding: 3.5mm 4mm; margin: 0 0 4mm; white-space: pre-wrap; }
  pre code { font: 9pt Consolas, "SF Mono", Menlo, monospace; color: var(--ink); }
  #sources + p { font-size: 8.5pt; color: var(--muted); }
</style></head><body>${html}</body></html>`;

const tmp = join(tmpdir(), `app-playbook-${process.pid}.html`);
writeFileSync(tmp, page);
if (process.env.PLAYBOOK_HTML) writeFileSync(process.env.PLAYBOOK_HTML, page);
mkdirSync(join(ROOT, "docs"), { recursive: true });

const result = spawnSync(
  browser,
  ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${OUT}`, pathToFileURL(tmp).href],
  { stdio: "pipe", encoding: "utf8" },
);
rmSync(tmp, { force: true });
if (result.status !== 0 || !existsSync(OUT)) {
  console.error(result.stderr || `browser exited with ${result.status}`);
  process.exit(1);
}
console.log(`Wrote ${OUT}`);
