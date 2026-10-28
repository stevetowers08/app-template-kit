#!/usr/bin/env node
// Static icon-size scan for a React/TSX repo. Reads the JSX tree with the repo's
// own TypeScript compiler (never grep: "is this icon inside a Button" is a
// structural question). Read-only.
//
//   node icon-scan.mjs --root <repo> [--scale 12,16,28] [--dirs src,app,components,lib,features,pages]
//        [--exempt src/features/landing/,app/lab/] [--button-file src/components/ui/button.tsx]
//        [--json out.json]
//
// Reports: icon elements found, written sizes outside Buttons, off-scale sites,
// dead sizes inside Buttons (the Button's [&_svg]:size-N outranks a class on the
// svg), icons with no size (they render at the library default), and per-file
// violation counts (the shape a guard-test baseline needs).
import { createRequire } from "node:module";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]?.startsWith("--") ? "true" : all[i + 1] ?? "true"]] : acc), []),
);
const ROOT = resolve(args.root ?? ".");
const SCALE = args.scale ? args.scale.split(",").map(Number) : null;
// Default roots cover a single app (src, app, ...) and a monorepo (apps, packages).
const DIRS = (args.dirs ?? "src,app,components,lib,features,pages,apps,packages").split(",").filter((d) => existsSync(resolve(ROOT, d)));
const EXEMPT = (args.exempt ?? "").split(",").filter(Boolean);
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
const require = createRequire(resolve(ROOT, "package.json"));
const ts = require("typescript");

// Icon packages, and facades: any module whose last segment is icons / app-icons /
// icons-server, or that sits under an /icons/ folder. Override with --icon-modules <regex>.
const ICON_MODULE = args["icon-modules"] ? new RegExp(args["icon-modules"], "i")
  : /^(lucide-react(\/.*)?|@phosphor-icons\/react(\/.*)?|@tabler\/icons-react(\/.*)?|@heroicons\/react\/.+|react-icons\/.+|@radix-ui\/react-icons|@icons-pack\/.+|.*(^|\/)([\w-]+-)?icons(-server)?|.*\/icons\/.+)$/i;
// The Button primitive, however the repo spells the path (@/components/ui/Button,
// @workspace/ui/components/button). Override with --button-modules <regex>.
const BUTTON_MODULE = args["button-modules"] ? new RegExp(args["button-modules"], "i") : /(^|\/)(button|icon-button)$/i;
const LOCAL_ICON_NAME = /^(Icon|[A-Z]\w*Icon)$/;

// ---- what the Button forces on its svg children ------------------------------
// Look in the app and up to two levels above it (a monorepo's packages/ui), either casing.
const UI_CANDIDATES = ["src/components/ui", "components/ui", "packages/ui/src/components/ui", "packages/ui/src/components", "packages/ui/components"];
const findUiFile = (name) => [ROOT, resolve(ROOT, ".."), resolve(ROOT, "../..")]
  .flatMap((base) => UI_CANDIDATES.flatMap((d) => [name, name[0].toUpperCase() + name.slice(1)].map((n) => resolve(base, d, `${n}.tsx`))))
  .find((f) => existsSync(f));
const buttonFile = args["button-file"] ? resolve(ROOT, args["button-file"]) : findUiFile("button");
const px = (tok) => (tok.startsWith("[") ? parseFloat(tok.slice(1)) * (tok.includes("rem") ? 16 : 1) : Number(tok) * 4);
const forcing = { base: null, conditional: false, bySize: {} };
if (buttonFile) {
  const src = readFileSync(buttonFile, "utf8");
  const rule = /\[&_svg(:not\(\[class\*=['"]size-['"]\]\))?\]:size-(\d+(?:\.\d+)?|\[[\d.]+(?:px|rem)\])/g;
  const cvaStart = src.indexOf("variants");
  const baseText = cvaStart > 0 ? src.slice(0, cvaStart) : src;
  for (const m of baseText.matchAll(rule)) { forcing.base = px(m[2]); forcing.conditional = Boolean(m[1]); }
  const sizeBlock = src.slice(src.indexOf("size:", cvaStart));
  // The value's closing quote must match its opening one: size values carry the other quote
  // inside (`"...[class*='size-']..."`).
  for (const m of sizeBlock.matchAll(/["']?([\w-]+)["']?\s*:\s*(["'`])((?:(?!\2)[^\\]|\\.)*)\2/g)) {
    const r = [...m[3].matchAll(rule)].pop();
    if (r) forcing.bySize[m[1]] = px(r[2]);
  }
}

// ---- helpers ------------------------------------------------------------------
const opening = (n) => (ts.isJsxSelfClosingElement(n) ? n : ts.isJsxElement(n) ? n.openingElement : null);
const attr = (el, name) => el.attributes.properties.find((p) => ts.isJsxAttribute(p) && ts.isIdentifier(p.name) && p.name.text === name);
function classText(el) {
  const init = attr(el, "className")?.initializer;
  if (!init) return "";
  const parts = [];
  const visit = (n) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) parts.push(n.text);
    if (ts.isTemplateExpression(n)) parts.push(n.head.text, ...n.templateSpans.map((s) => s.literal.text));
    ts.forEachChild(n, visit);
  };
  visit(init);
  return parts.join(" ");
}
function utility(tok) {
  let depth = 0, cut = 0;
  for (let i = 0; i < tok.length; i++) {
    if (tok[i] === "[") depth++;
    else if (tok[i] === "]") depth--;
    else if (tok[i] === ":" && depth === 0) cut = i + 1;
  }
  return tok.slice(cut).replace(/^!|!$/g, "");
}
function classSizes(cls) {
  const out = [];
  for (const raw of cls.split(/\s+/)) {
    const m = /^(size|h|w)-(\d+(?:\.\d+)?|\[[\d.]+(?:px|rem)\])$/.exec(utility(raw));
    if (m) out.push({ axis: m[1], px: px(m[2]) });
  }
  return out;
}
function sizeProp(el) {
  let e = attr(el, "size")?.initializer;
  if (e && ts.isJsxExpression(e)) e = e.expression;
  if (e && ts.isNumericLiteral(e)) return Number(e.text);
  if (e && ts.isStringLiteral(e) && /^\d+$/.test(e.text)) return Number(e.text);
  return e ? "dynamic" : null;
}

// ---- scan ---------------------------------------------------------------------
const files = DIRS.flatMap((d) => listFiles(d).map((f) => `${d}/${f}`))
  .filter((f) => /\.(tsx|jsx)$/.test(f) && !/\.(test|spec|stories)\.(tsx|jsx)$/.test(f) && !EXEMPT.some((e) => f.startsWith(e)) && !f.includes("node_modules"))
  .sort();
const written = {};
const offScale = [], deadInButton = [], unsized = [], dynamic = [];
const perFile = {}, unrecognised = {};
let icons = 0;

for (const file of files) {
  const sf = ts.createSourceFile(file, readFileSync(resolve(ROOT, file), "utf8"), ts.ScriptTarget.Latest, true, file.endsWith(".jsx") ? ts.ScriptKind.JSX : ts.ScriptKind.TSX);
  const iconNames = new Set(), iconObjects = new Set(), buttons = new Set(), importOf = new Map();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier) || st.importClause?.isTypeOnly) continue;
    const mod = st.moduleSpecifier.text;
    const nb = st.importClause?.namedBindings;
    if (st.importClause?.name) importOf.set(st.importClause.name.text, mod);
    if (nb && ts.isNamedImports(nb)) for (const s of nb.elements) importOf.set(s.name.text, mod);
    if (ICON_MODULE.test(mod)) {
      if (st.importClause?.name) iconNames.add(st.importClause.name.text);
      if (nb && ts.isNamespaceImport(nb)) iconObjects.add(nb.name.text);
      if (nb && ts.isNamedImports(nb)) for (const s of nb.elements) {
        if (s.isTypeOnly || !/^[A-Z]/.test(s.name.text) || /Context|Props$|Provider$/.test(s.name.text)) continue;
        if ((s.propertyName ?? s.name).text === "Icons") iconObjects.add(s.name.text); else iconNames.add(s.name.text);
      }
    }
    if (BUTTON_MODULE.test(mod) && nb && ts.isNamedImports(nb)) for (const s of nb.elements) {
      if (["Button", "IconButton"].includes((s.propertyName ?? s.name).text)) buttons.add(s.name.text);
    }
  }
  const isIcon = (t) => (ts.isIdentifier(t) ? iconNames.has(t.text) || LOCAL_ICON_NAME.test(t.text)
    : ts.isPropertyAccessExpression(t) && ts.isIdentifier(t.expression) && iconObjects.has(t.expression.text));
  const enclosingButton = (n) => {
    for (let p = n.parent; p; p = p.parent) {
      if (ts.isJsxAttribute(p)) return null;
      if (ts.isJsxElement(p) && ts.isIdentifier(p.openingElement.tagName) && buttons.has(p.openingElement.tagName.text)) return p.openingElement;
    }
    return null;
  };
  const visit = (n) => {
    const el = opening(n);
    if (el && isIcon(el.tagName)) {
      icons++;
      const loc = `${file}:${sf.getLineAndCharacterOfPosition(el.getStart(sf)).line + 1} <${el.tagName.getText(sf)}>`;
      const sizes = classSizes(classText(el));
      const sp = sizeProp(el);
      if (sp === "dynamic") dynamic.push(loc);
      const all = [...sizes.map((s) => s.px), ...(typeof sp === "number" ? [sp] : [])];
      const btn = enclosingButton(el);
      if (btn && forcing.base !== null) {
        const sizeAttr = attr(btn, "size")?.initializer;
        let forced = sizeAttr && ts.isStringLiteral(sizeAttr) && forcing.bySize[sizeAttr.text] !== undefined ? forcing.bySize[sizeAttr.text] : forcing.base;
        for (const m of classText(btn).matchAll(/\[&_svg\]:size-(\d+(?:\.\d+)?|\[[\d.]+(?:px|rem)\])/g)) forced = px(m[1]);
        // Upstream's :not([class*='size-']) lets a size-* class through; h-/w- still lose.
        const escapes = forcing.conditional && sizes.some((s) => s.axis === "size");
        const wrong = escapes ? [] : [...new Set(all.filter((v) => v !== forced))];
        if (wrong.length) { deadInButton.push(`${loc} written ${wrong.join("/")}px, renders ${forced}px`); perFile[file] = (perFile[file] ?? 0) + 1; }
      } else {
        for (const v of new Set(all)) written[v] = (written[v] ?? 0) + 1;
        if (!all.length && sp === null) unsized.push(loc);
        const off = SCALE ? [...new Set(all.filter((v) => !SCALE.includes(v)))] : [];
        if (off.length) { offScale.push(`${loc} ${off.join("/")}px`); perFile[file] = (perFile[file] ?? 0) + 1; }
      }
    } else if (el && ts.isJsxSelfClosingElement(n) && ts.isIdentifier(el.tagName) && /^[A-Z]/.test(el.tagName.text) && !buttons.has(el.tagName.text)
      && !/(Skeleton|Checkbox|Avatar|Switch|Radio|Badge|Separator|Input|Spinner|Progress|Image|Logo)/.test(el.tagName.text)) {
      // Coverage check: a self-closing component sized like an icon that no rule recognised.
      const s = classSizes(classText(el));
      const h = s.filter((x) => x.axis !== "w").map((x) => x.px), w = s.filter((x) => x.axis !== "h").map((x) => x.px);
      if (s.length && Math.max(...s.map((x) => x.px)) <= 32 && h.some((v) => w.includes(v))) {
        const mod = importOf.get(el.tagName.text) ?? "(local)";
        unrecognised[mod] = (unrecognised[mod] ?? 0) + 1;
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}

// The library default an unsized icon renders at (Phosphor-style context providers).
const defaults = [];
for (const d of DIRS) for (const f of listFiles(d)) {
  if (!/\.(tsx|ts)$/.test(f) || String(f).includes("node_modules")) continue;
  const t = readFileSync(resolve(ROOT, d, f), "utf8");
  const m = /IconContext\.Provider\s+value=\{\{[^}]*\bsize:\s*(\d+)/.exec(t);
  if (m) defaults.push(`${d}/${String(f).split("\\").join("/")}: ${m[1]}px`);
}

const sortedWritten = Object.entries(written).sort((a, b) => Number(a[0]) - Number(b[0]));
console.log(`files ${files.length} · icon elements ${icons}${icons < 20 ? "  <- suspiciously few: check the icon-module pattern" : ""}`);
if (!files.length) { console.error("no TSX/JSX files under " + DIRS.join(", ") + " - pass --root and --dirs"); process.exit(1); }
console.log(`button forcing: ${!buttonFile ? "no Button primitive found" : forcing.base === null ? `none - the Button does not size its svg children (${buttonFile.replace(ROOT, ".")})` : `${forcing.base}px${forcing.conditional ? " unless the icon has a size-* class" : " (unconditional)"}, per size ${JSON.stringify(forcing.bySize)} (${buttonFile.replace(ROOT, ".")})`}`);
console.log(`global icon default: ${defaults.join("; ") || "none found (lucide/tabler default to 24px)"}`);
const missed = Object.entries(unrecognised).filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]);
if (missed.length) console.log(`COVERAGE: icon-sized components from modules no rule recognised - add them with --icon-modules if they are icons: ${missed.slice(0, 6).map(([m, n]) => `${m} (${n})`).join(" · ")}`);
console.log(`written sizes outside Buttons (px: sites): ${sortedWritten.map(([k, v]) => `${k}: ${v}`).join(" · ") || "none"}`);
console.log(`distinct written sizes: ${sortedWritten.length}${SCALE ? ` · scale ${SCALE.join("/")} · off-scale sites ${offScale.length}` : ""}`);
console.log(`dead sizes inside Buttons: ${deadInButton.length} · unsized outside Buttons: ${unsized.length} · dynamic size props: ${dynamic.length}`);
const show = (title, list) => list.length && console.log(`\n${title} (${list.length}):\n  ${list.slice(0, 40).join("\n  ")}${list.length > 40 ? `\n  ... ${list.length - 40} more (--json)` : ""}`);
show("off-scale", offScale);
show("dead sizes inside Buttons", deadInButton);
if (args.json) writeFileSync(resolve(args.json), JSON.stringify({ root: ROOT, scale: SCALE, forcing, defaults, written, offScale, deadInButton, unsized, dynamic, perFile }, null, 1));
