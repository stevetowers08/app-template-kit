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
  @page { size: A4; margin: 14mm 16mm 16mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--paper); color: var(--body);
    font: 9.5pt/1.5 "Segoe UI Variable Text", "Segoe UI", -apple-system, "Helvetica Neue", Arial, sans-serif;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  a { color: inherit; text-decoration: none; }
  strong { color: var(--ink); font-weight: 600; }
  p { margin: 0 0 2mm; }

  /* Top: title, how to use, the map. Flows straight into the parts. */
  h1 { font-size: 20pt; line-height: 1.15; letter-spacing: -0.01em; color: var(--ink); margin: 0 0 2mm; font-weight: 700; }
  .cover > p:first-of-type { font-size: 10.5pt; color: var(--ink); }
  table.map { width: 100%; border-collapse: collapse; margin: 3mm 0 3mm; }
  table.map th {
    text-align: left; font-size: 7pt; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--muted); padding: 0 0 1.5mm; border-bottom: 1px solid var(--ink);
  }
  table.map td { padding: 1.3mm 0; border-bottom: 1px solid var(--line); vertical-align: middle; }
  table.map td:first-child { font-weight: 600; color: var(--ink); width: 30%; }

  /* Chips: filled for build, outlined for check */
  .chip {
    display: inline-block; font: 500 7.8pt/1 "Cascadia Mono", Consolas, "SF Mono", Menlo, monospace;
    padding: 1mm 2mm; border-radius: 99px; border: 1px solid var(--line);
    background: var(--soft); color: var(--ink); white-space: nowrap;
  }
  table.map td:nth-child(2) .chip, .meta-build .chip { background: var(--ink); border-color: var(--ink); color: var(--paper); }
  table.map td:nth-child(3) .chip, .meta-check .chip { background: var(--paper); border-color: var(--ink); }

  /* Parts: one rolling document, no forced page breaks */
  .part { padding: 4mm 0 3mm; border-top: 1px solid var(--line); }
  h2 { font-size: 12.5pt; color: var(--ink); margin: 0 0 0.5mm; font-weight: 700; break-after: avoid; }
  h2 + p { color: var(--muted); margin: 0 0 1.5mm; break-after: avoid; }
  ul { margin: 0 0 2mm; padding: 0; list-style: none; }
  li { position: relative; padding-left: 4mm; margin: 0 0 0.6mm; break-inside: avoid; }
  li::before { content: ""; position: absolute; left: 0.5mm; top: 1.9mm; width: 1.3mm; height: 1.3mm; border-radius: 50%; background: var(--ink); }
  li code { font: 8.5pt Consolas, monospace; }

  .strip { display: flex; flex-wrap: wrap; gap: 1.5mm 6mm; align-items: center; padding: 2mm 3mm; background: var(--soft); border-radius: 2mm; break-inside: avoid; }
  .meta { display: flex; align-items: center; gap: 2mm; }
  .label { font-size: 7pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
  .meta-done-when { flex-basis: 100%; color: var(--ink); }
  .meta-done-when .label { color: var(--done); }
  .meta-done-when .label::before { content: "\\2713  "; }

  pre { background: var(--soft); border-radius: 2mm; padding: 2mm 3mm; margin: 0 0 2mm; white-space: pre-wrap; break-inside: avoid; }
  pre code { font: 8.5pt Consolas, "SF Mono", Menlo, monospace; color: var(--ink); }
  #sources + p { font-size: 8pt; color: var(--muted); }
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
