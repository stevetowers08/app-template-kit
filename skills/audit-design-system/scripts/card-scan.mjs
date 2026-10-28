#!/usr/bin/env node
// Static card-shell scan for a React/TSX repo: primitive card usage, className
// overrides of those primitives, and hand-built framed boxes grouped by their
// resting-class signature. Reads the JSX tree with the repo's own TypeScript.
// Read-only.
//
//   node card-scan.mjs --root <repo> [--dirs src,app,components,lib,features,pages] [--ui-dir src/components/ui]
//        [--exempt src/features/landing/,app/lab/] [--json out.json]
import { createRequire } from "node:module";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]?.startsWith("--") ? "true" : all[i + 1] ?? "true"]] : acc), []),
);
const ROOT = resolve(args.root ?? ".");
// Default roots cover a single app (src, app, ...) and a monorepo (apps, packages).
const DIRS = (args.dirs ?? "src,app,components,lib,features,pages,apps,packages").split(",").filter((d) => existsSync(resolve(ROOT, d)));
// Build output and dependencies are never scanned; a recursive readdir into `.next/` is slow and
// throws while a build is writing it.
const SKIP_DIRS = new Set(["node_modules", ".next", ".turbo", ".git", "dist", "build", "out", "coverage", ".vercel"]);
function listFiles(dir, prefix = "") {
  const out = [];
  for (const e of readdirSync(resolve(ROOT, dir, prefix), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) out.push(...listFiles(dir, rel)); }
    else out.push(rel);
  }
  return out;
}
// The shared UI dir: in the app, or up to two levels above it (a monorepo's packages/ui).
const UI_CANDIDATES = ["src/components/ui", "components/ui", "packages/ui/src/components/ui", "packages/ui/src/components", "packages/ui/components"];
const UI_DIRS = args["ui-dir"] ? [resolve(ROOT, args["ui-dir"])]
  : [ROOT, resolve(ROOT, ".."), resolve(ROOT, "../..")].flatMap((b) => UI_CANDIDATES.map((d) => resolve(b, d))).filter((d) => existsSync(d));
// The dir that holds the Card primitive wins; an app-local components/ui without one does not.
const cardFile = UI_DIRS.flatMap((d) => ["card.tsx", "Card.tsx"].map((n) => resolve(d, n))).find((f) => existsSync(f));
const UI_ABS = cardFile ? resolve(cardFile, "..") : UI_DIRS[0];
const UI_DIR = UI_ABS && relative(ROOT, UI_ABS).split("\\").join("/");
// Primitives define shells; only exempt the UI dir when it sits inside the scanned app.
const EXEMPT = [...(args.exempt ?? "").split(",").filter(Boolean),
  ...UI_DIRS.map((d) => relative(ROOT, d).split("\\").join("/")).filter((d) => d && !d.startsWith("..")).map((d) => `${d}/`)];
const require = createRequire(resolve(ROOT, "package.json"));
const ts = require("typescript");

const CARD_NAME = /(Card|Tile|Notice|Callout|Alert|Section|Panel)$/;
const ICON_MODULE = /^(lucide-react(\/.*)?|@phosphor-icons\/react(\/.*)?|@tabler\/icons-react(\/.*)?|@heroicons\/react\/.+|react-icons\/.+|@radix-ui\/react-icons|@icons-pack\/.+|.*(^|\/)([\w-]+-)?icons(-server)?|.*\/icons\/.+)$/i;
const NOT_A_CARD = /(HoverCard|Header|Content|Title|Description|Footer|Trigger|Action|Label)$/;
const BOX_TAGS = new Set(["div", "section", "article", "li", "aside", "a", "label", "form", "details", "ul", "dl", "fieldset"]);
const SHELL_TOKEN = /^(rounded|border|bg-|shadow|p[xytrbl]?-\d|p[xytrbl]?-\[)/;

function classText(el) {
  const a = el.attributes.properties.find((p) => ts.isJsxAttribute(p) && ts.isIdentifier(p.name) && p.name.text === "className");
  if (!a?.initializer) return "";
  const parts = [];
  const visit = (n) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) parts.push(n.text);
    if (ts.isTemplateExpression(n)) parts.push(n.head.text, ...n.templateSpans.map((s) => s.literal.text));
    ts.forEachChild(n, visit);
  };
  visit(a.initializer);
  return parts.join(" ");
}
/** Resting utilities only: drops hover:/sm:/data-[..]: variants. */
const base = (cls) => cls.split(/\s+/).filter((t) => t && !/:/.test(t.replace(/\[[^\]]*\]/g, "")));
function signature(tokens) {
  const pick = (re) => tokens.filter((t) => re.test(t));
  return {
    radius: pick(/^rounded(-(none|sm|md|lg|xl|2xl|3xl|4xl|full|\[.+\]))?$/).filter((r) => !/full|none/.test(r)),
    border: pick(/^border(-(0|2|4|8|dashed|dotted|none|\[\d+px\]))?$/),
    borderColor: pick(/^border-(?!(0|2|4|8|dashed|dotted|none|solid|collapse|separate|spacing|[trblxyse]$|[trblxyse]-))[a-z].*/),
    bg: pick(/^bg-(?!(clip|origin|no-repeat|repeat|cover|contain|center|fixed|local|scroll|gradient|linear|none|blend))/),
    shadow: pick(/^shadow(-.+)?$/),
    pad: pick(/^p[xytrbl]?-(\d|\[)/),
  };
}

// The Card primitive's own shell, for counting exact hand-built copies.
let cardShell = null;
if (cardFile) {
  const src = readFileSync(cardFile, "utf8");
  const at = src.search(/(const|function)\s+Card\b/);
  const lit = at >= 0 ? /["'`]([^"'`]*rounded[^"'`]*)["'`]/.exec(src.slice(at)) : null;
  if (lit) { const s = signature(base(lit[1])); cardShell = { radius: s.radius.join(" "), bg: s.bg.join(" "), text: lit[1] }; }
}

const files = DIRS.flatMap((d) => listFiles(d).map((f) => `${d}/${f}`))
  .filter((f) => /\.(tsx|jsx)$/.test(f) && !/\.(test|spec|stories)\.(tsx|jsx)$/.test(f) && !EXEMPT.some((e) => f.startsWith(e)) && !f.includes("node_modules"))
  .sort();

const usage = {}, overrides = [], shells = [];
for (const file of files) {
  const sf = ts.createSourceFile(file, readFileSync(resolve(ROOT, file), "utf8"), ts.ScriptTarget.Latest, true, file.endsWith(".jsx") ? ts.ScriptKind.JSX : ts.ScriptKind.TSX);
  const iconTags = new Set();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier) || !ICON_MODULE.test(st.moduleSpecifier.text)) continue;
    const nb = st.importClause?.namedBindings;
    if (st.importClause?.name) iconTags.add(st.importClause.name.text);
    if (nb && ts.isNamedImports(nb)) for (const s of nb.elements) iconTags.add(s.name.text);
  }
  const visit = (n) => {
    const el = ts.isJsxSelfClosingElement(n) ? n : ts.isJsxElement(n) ? n.openingElement : null;
    if (el) {
      const tag = el.tagName.getText(sf);
      const loc = `${file}:${sf.getLineAndCharacterOfPosition(el.getStart(sf)).line + 1}`;
      const tokens = base(classText(el));
      if (/^[A-Z]/.test(tag) && CARD_NAME.test(tag) && !NOT_A_CARD.test(tag) && !iconTags.has(tag)) {
        usage[tag] = (usage[tag] ?? 0) + 1;
        const shellOverride = tokens.filter((t) => SHELL_TOKEN.test(t));
        if (shellOverride.length) overrides.push({ loc, tag, tokens: shellOverride });
      }
      if (BOX_TAGS.has(tag)) {
        const s = signature(tokens);
        const control = tokens.some((t) => /^(inline-flex|size-\d|h-(5|6|7|8|9|10)|w-(5|6|7|8|9|10))$/.test(t));
        const framed = s.border.length > 0 && !s.border.some((b) => /-(0|none)$/.test(b));
        if (s.radius.length && framed && !control) shells.push({ loc, tag, ...s });
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}

const tally = (arr, key) => Object.entries(arr.reduce((m, x) => { const k = key(x) || "(none)"; m[k] = (m[k] ?? 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);
const tinted = shells.filter((s) => s.borderColor.some((c) => /\/\d+$/.test(c)) || s.bg.some((b) => /\/\d+$/.test(b)));
const exactCopies = cardShell ? shells.filter((s) => s.radius.join(" ") === cardShell.radius && s.bg.join(" ") === cardShell.bg) : [];
const overridden = tally(overrides, (o) => o.tag);
const line = (pairs, n = 10) => pairs.slice(0, n).map(([k, v]) => `${k}: ${v}`).join(" · ");

console.log(`files ${files.length} · ui dir ${UI_DIR ?? "not found"} · Card shell ${cardShell ? `"${cardShell.text}"` : "not found"}`);
if (!files.length) { console.error("no TSX/JSX files under " + DIRS.join(", ") + " - pass --root and --dirs"); process.exit(1); }
console.log(`card-like primitive usage: ${line(Object.entries(usage).sort((a, b) => b[1] - a[1]), 20) || "none"}`);
console.log(`primitive uses overriding radius/border/bg/shadow/padding: ${overrides.length} (${line(overridden)})`);
console.log(`hand-built framed boxes: ${shells.length} · exact copies of the Card shell: ${cardShell ? exactCopies.length : "n/a"} · tinted: ${tinted.length}`);
console.log(`  radius: ${line(tally(shells, (s) => s.radius.join(" ")))}`);
console.log(`  surface: ${line(tally(shells, (s) => s.bg.join(" ")))}`);
console.log(`  padding: ${line(tally(shells, (s) => s.pad.join(" ")), 12)}`);
console.log(`  tint strengths: ${line(tally(tinted, (s) => [...s.bg, ...s.borderColor].filter((t) => /\/\d+$/.test(t)).map((t) => t.replace(/^(bg|border)-[\w-]+/, "$1")).join(" ")))}`);
console.log(`\ntop shell signatures (radius | border | border colour | surface | shadow):`);
for (const [sig, n] of tally(shells, (s) => [s.radius, s.border, s.borderColor, s.bg, s.shadow].map((x) => x.join(" ")).join(" | ")).slice(0, 15)) console.log(`  ${String(n).padStart(4)}  ${sig}`);
if (args.json) writeFileSync(resolve(args.json), JSON.stringify({ root: ROOT, uiDir: UI_DIR, cardShell, usage, overrides, shells, exactCopies: exactCopies.map((s) => s.loc) }, null, 1));
