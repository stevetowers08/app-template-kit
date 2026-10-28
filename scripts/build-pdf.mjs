// Renders PLAYBOOK.md to docs/app-playbook.pdf with headless Chrome or Edge.
// PLAYBOOK.md is the source; never edit the PDF by hand. Set CHROME=/path/to/browser if it is
// not found.
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

const md = readFileSync(join(ROOT, "PLAYBOOK.md"), "utf8")
  // Repo-relative links point at GitHub in the PDF.
  .replace(/\]\((README\.md|AGENTS\.md|skills\/[^)]*)\)/g, (_, p) => `](${REPO}/blob/main/${p})`);

const body = marked.parse(md).replace(/<code>(\/?[a-z][a-z0-9-]+)<\/code>/g, (m, name) => {
  // Link every kit skill name to its SKILL.md on GitHub.
  const bare = name.replace(/^\//, "");
  return existsSync(join(ROOT, "skills", bare, "SKILL.md"))
    ? `<a class="skill" href="${REPO}/blob/main/skills/${bare}/SKILL.md"><code>${name}</code></a>`
    : m;
});

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>App Playbook</title>
<style>
  :root {
    --ink: #1a1d24; --muted: #5b6270; --line: #dde1e8; --soft: #f4f6f9; --accent: #2540e8; --paper: #ffffff;
  }
  @page { size: A4; margin: 16mm 15mm 18mm; }
  * { box-sizing: border-box; }
  body { font: 10pt/1.5 "Segoe UI", -apple-system, "Helvetica Neue", Arial, sans-serif; color: var(--ink); background: var(--paper); margin: 0; }
  h1 { font-size: 26pt; margin: 0 0 6pt; color: var(--accent); }
  h2 { font-size: 15pt; margin: 18pt 0 6pt; color: var(--accent); break-after: avoid; }
  /* New page only at the big sections; the parts flow on. */
  #the-map, #1-repo-and-agent-setup, #every-new-feature, #all-skills-in-this-kit, #sources { break-before: page; margin-top: 0; }
  ul, ol, tr { break-inside: avoid; }
  h3 { font-size: 11.5pt; margin: 14pt 0 4pt; }
  p, li { margin: 0 0 5pt; }
  ul, ol { padding-left: 16pt; margin: 0 0 8pt; }
  a { color: var(--accent); text-decoration: none; }
  code { font: 8.8pt Consolas, "SF Mono", Menlo, monospace; background: var(--soft); padding: 0 3pt; border-radius: 3pt; }
  a.skill code { color: var(--accent); }
  table { width: 100%; border-collapse: collapse; margin: 6pt 0 10pt; font-size: 8.6pt; }
  th, td { text-align: left; vertical-align: top; padding: 4pt 5pt; border-bottom: 1px solid var(--line); }
  th { background: var(--soft); font-weight: 600; }
  tr { break-inside: avoid; }
  hr { display: none; }
  strong { font-weight: 600; }
  input[type=checkbox] { margin-right: 5pt; }
</style></head><body>${body}</body></html>`;

const tmp = join(tmpdir(), `app-playbook-${process.pid}.html`);
writeFileSync(tmp, html);
if (process.env.PLAYBOOK_HTML) writeFileSync(process.env.PLAYBOOK_HTML, html); // preview copy
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
