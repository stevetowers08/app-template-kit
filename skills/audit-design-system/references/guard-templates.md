# Guard-test templates (icon sizes, card shells)

Load when a DS1·icons or DS2·cards finding should become a test (a rule violated twice becomes a
test, not a third copy of the rule). Both are vitest unit tests that read the JSX tree with the
repo's own `typescript`, with a per-file count baseline so existing debt is frozen and can only
shrink.

Contents: [Adopting either guard](#adopting-either-guard) · [Icon sizes](#icon-sizes-guard) ·
[Card shells](#card-shells-guard)

## Adopting either guard

1. Copy the template to `tests/unit/<name>.test.ts`; set the constants in its first block from
   the repo (scale, UI dir, primitive names, exempt dirs). Keep the header comment accurate: it is
   the only place the next reader learns why the test exists.
2. Seed the baseline: `UPDATE_<NAME>_BASELINE=1 npx vitest run tests/unit/<name>.test.ts`.
3. **Prove it fails** before trusting it: plant one violation in a real file (or rely on the
   self-test block, which must go red if its detection breaks), run, see the exact file:line in
   the failure, then remove the plant and see green. A guard that has never failed is not coverage.
4. Prove the ratchet: fix one baselined site, run, and see "baseline N, now N-1 - lower it".
5. Record the rule in `docs/design/` and point the doc at the test.

Never add an auto-regenerate path (`if (!existsSync(BASELINE)) write(...)`): deleting the
baseline would then pass silently.

## Icon sizes guard

Proven in a production app (`tests/unit/icon-sizes.test.ts`, 2026-09-28): failed on a planted 14px
icon with its file:line, and failed until a fixed file's baseline count was lowered.

```ts
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * <State the scale and each size's role, e.g. "A plain icon is 16px; 12px only inside small
 * containers; 28px only for empty states". Say why (the drift it replaced) and what it cannot
 * see: sizes held in variables or maps, and which step a role should take.>
 *
 * Backlog: icon-sizes-baseline.json, a count per file. Cleared some? Regenerate with
 *   UPDATE_ICON_SIZE_BASELINE=1 npx vitest run tests/unit/icon-sizes.test.ts
 */

// ---- set these from the repo -------------------------------------------------------------
const SCALE = [12, 16, 28];
const ICON_MODULE = /^(lucide-react(\/.*)?|@phosphor-icons\/react(\/.*)?|@tabler\/icons-react(\/.*)?|@heroicons\/react\/.+|react-icons\/.+|@radix-ui\/react-icons|.*(^|\/)([\w-]+-)?icons(-server)?|.*\/icons\/.+)$/i;
const BUTTON_MODULE = /(^|\/)(button|icon-button)$/i;
/** The size the Button forces on svg children, and whether a size-* class escapes it
 * (upstream shadcn: `[&_svg:not([class*='size-'])]:size-4`) or not (older copies: `[&_svg]:size-4`). */
const BUTTON_SVG_PX = 16;
const SIZE_CLASS_ESCAPES_BUTTON = false;
const BUTTON_SIZE_OVERRIDES: Record<string, number> = { /* "icon-header": 22 */ };
const DIRS = ["src", "app"];
const EXEMPT_DIRS: string[] = [/* mock-ups that draw the app in miniature */];
// --------------------------------------------------------------------------------------------

const ROOT = resolve(__dirname, "../..");
const BASELINE = resolve(ROOT, "tests/unit/icon-sizes-baseline.json");
const LOCAL_ICON_NAME = /^(Icon|[A-Z]\w*Icon)$/;

type Opening = ts.JsxOpeningElement | ts.JsxSelfClosingElement;
const opening = (n: ts.Node): Opening | null => (ts.isJsxSelfClosingElement(n) ? n : ts.isJsxElement(n) ? n.openingElement : null);
const attr = (el: Opening, name: string) => el.attributes.properties.find(
  (p): p is ts.JsxAttribute => ts.isJsxAttribute(p) && ts.isIdentifier(p.name) && p.name.text === name);

function classText(el: Opening): string {
  const init = attr(el, "className")?.initializer;
  if (!init) return "";
  const parts: string[] = [];
  const visit = (n: ts.Node): void => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) parts.push(n.text);
    if (ts.isTemplateExpression(n)) parts.push(n.head.text, ...n.templateSpans.map((s) => s.literal.text));
    ts.forEachChild(n, visit);
  };
  visit(init);
  return parts.join(" ");
}
/** `group-hover:!h-4` -> `h-4`: drops variants (a colon outside brackets) and the important mark. */
function utility(tok: string): string {
  let depth = 0, cut = 0;
  for (let i = 0; i < tok.length; i++) {
    if (tok[i] === "[") depth++; else if (tok[i] === "]") depth--; else if (tok[i] === ":" && depth === 0) cut = i + 1;
  }
  return tok.slice(cut).replace(/^!|!$/g, "");
}
function classSizes(cls: string): { axis: string; px: number }[] {
  const out: { axis: string; px: number }[] = [];
  for (const raw of cls.split(/\s+/)) {
    const m = /^(size|h|w)-(?:(\d+(?:\.\d+)?)|\[(\d+(?:\.\d+)?)(px|rem)\])$/.exec(utility(raw));
    if (m) out.push({ axis: m[1], px: m[2] !== undefined ? Number(m[2]) * 4 : m[4] === "rem" ? Number(m[3]) * 16 : Number(m[3]) });
  }
  return out;
}
function numericSizeProp(el: Opening): number | null {
  let e: ts.Node | undefined = attr(el, "size")?.initializer;
  if (e && ts.isJsxExpression(e)) e = e.expression;
  if (e && ts.isNumericLiteral(e)) return Number(e.text);
  return null;
}
function forcedSize(button: Opening): number {
  const size = attr(button, "size")?.initializer;
  let px = size && ts.isStringLiteral(size) && BUTTON_SIZE_OVERRIDES[size.text] !== undefined ? BUTTON_SIZE_OVERRIDES[size.text] : BUTTON_SVG_PX;
  for (const m of classText(button).matchAll(/\[&_svg\]:size-(?:(\d+(?:\.\d+)?)|\[(\d+)px\])/g)) px = m[1] !== undefined ? Number(m[1]) * 4 : Number(m[2]);
  return px;
}

function scan(file: string, source: string): { violations: string[]; icons: number } {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const iconNames = new Set<string>(), iconObjects = new Set<string>(), buttons = new Set<string>();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier) || st.importClause?.isTypeOnly) continue;
    const mod = st.moduleSpecifier.text;
    const nb = st.importClause?.namedBindings;
    if (ICON_MODULE.test(mod)) {
      if (st.importClause?.name) iconNames.add(st.importClause.name.text);
      if (nb && ts.isNamedImports(nb)) for (const s of nb.elements) {
        if (!/^[A-Z]/.test(s.name.text) || /Context|Props$|Provider$/.test(s.name.text)) continue;
        if ((s.propertyName ?? s.name).text === "Icons") iconObjects.add(s.name.text); else iconNames.add(s.name.text);
      }
    }
    if (BUTTON_MODULE.test(mod) && nb && ts.isNamedImports(nb)) for (const s of nb.elements) {
      if (["Button", "IconButton"].includes((s.propertyName ?? s.name).text)) buttons.add(s.name.text);
    }
  }
  const isIcon = (t: ts.JsxTagNameExpression) => (ts.isIdentifier(t) ? iconNames.has(t.text) || LOCAL_ICON_NAME.test(t.text)
    : ts.isPropertyAccessExpression(t) && ts.isIdentifier(t.expression) && iconObjects.has(t.expression.text));
  /** An icon passed as a prop renders wherever the prop lands, not in this Button. */
  const enclosingButton = (n: ts.Node): Opening | null => {
    for (let p = n.parent; p; p = p.parent) {
      if (ts.isJsxAttribute(p)) return null;
      if (ts.isJsxElement(p) && ts.isIdentifier(p.openingElement.tagName) && buttons.has(p.openingElement.tagName.text)) return p.openingElement;
    }
    return null;
  };
  const violations: string[] = [];
  let icons = 0;
  const visit = (n: ts.Node): void => {
    const el = opening(n);
    if (el && isIcon(el.tagName)) {
      icons++;
      const sizes = classSizes(classText(el));
      const prop = numericSizeProp(el);
      const written = [...sizes.map((s) => s.px), ...(prop === null ? [] : [prop])];
      const at = `${file}:${sf.getLineAndCharacterOfPosition(el.getStart(sf)).line + 1} <${el.tagName.getText(sf)}>`;
      const button = enclosingButton(el);
      if (button && !(SIZE_CLASS_ESCAPES_BUTTON && sizes.some((s) => s.axis === "size"))) {
        const forced = forcedSize(button);
        const wrong = [...new Set(written.filter((px) => px !== forced))];
        if (wrong.length) violations.push(`${at} written ${wrong.join("/")}px inside a Button that renders it at ${forced}px - drop the size`);
      } else {
        const off = [...new Set(written.filter((px) => !SCALE.includes(px)))];
        if (off.length) violations.push(`${at} ${off.join("/")}px is off the icon scale (${SCALE.join("/")})`);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return { violations, icons };
}

const files = DIRS.flatMap((dir) => readdirSync(resolve(ROOT, dir), { recursive: true, encoding: "utf8" })
  .map((f) => `${dir}/${f.split("\\").join("/")}`).filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx")))
  .filter((f) => !EXEMPT_DIRS.some((d) => f.startsWith(d))).sort();
const results = files.map((file) => ({ file, ...scan(file, readFileSync(resolve(ROOT, file), "utf8")) }));
const current: Record<string, number> = Object.fromEntries(results.filter((r) => r.violations.length).map((r) => [r.file, r.violations.length]));
if (process.env.UPDATE_ICON_SIZE_BASELINE === "1") writeFileSync(BASELINE, `${JSON.stringify({ files: current }, null, 2)}\n`);
const baseline: { files: Record<string, number> } = JSON.parse(readFileSync(BASELINE, "utf8"));

describe("icon sizes", () => {
  it("catches an off-scale icon and a dead size inside a Button", () => {
    // The guard's own guard. If these stop holding, the checks below check nothing.
    const imports = 'import { X } from "lucide-react";\nimport { Button } from "@/components/ui/button";\n';
    const count = (jsx: string) => scan("x.tsx", `${imports}const a = ${jsx};`).violations.length;
    expect(count('<X className="h-3.5 w-3.5" />')).toBe(1);
    expect(count('<X className={cn("shrink-0", open ? "size-[18px]" : "h-4 w-4")} />')).toBe(1);
    expect(count('<Icon className="h-6 w-6" />')).toBe(1);
    expect(count('<Button><X className="h-3 w-3" />Close</Button>')).toBe(1);
    expect(count('<X className="h-3 w-3 sm:h-4 sm:w-4" />')).toBe(0);
    expect(count("<Button><X />Close</Button>")).toBe(0);
    expect(count('<Button><Row icon={<X className="h-3 w-3" />} /></Button>')).toBe(0);
    expect(count('<Avatar className="h-6 w-6" />')).toBe(0);
  });
  it("scans the whole component tree", () => {
    // Without a denominator, "no offenders" and "found no icons" read the same. Set to ~80% of today's counts.
    expect(files.length).toBeGreaterThan(100);
    expect(results.reduce((n, r) => n + r.icons, 0)).toBeGreaterThan(100);
  });
  it("adds no new off-scale icon", () => {
    expect(results.flatMap((r) => (r.violations.length > (baseline.files[r.file] ?? 0) ? r.violations : []))).toEqual([]);
  });
  it("keeps the baseline honest as icons are fixed", () => {
    expect(Object.entries(baseline.files).filter(([f, n]) => (current[f] ?? 0) < n).map(([f, n]) => `${f}: baseline ${n}, now ${current[f] ?? 0} - lower it`)).toEqual([]);
  });
});
```

Add a "defaults still hold" test for whatever the guard relies on: the icon library's global
default size (`IconContext.Provider value={{ size: 16 }}` for Phosphor-style sets) and the
Button's svg rule. If either moves, icons leave the scale without this test noticing.

## Card shells guard

Fails on a new hand-built framed box (a rounded, fully bordered element outside the UI dir), and
on a card primitive whose call site overrides its shell (radius, border, surface, shadow,
padding). Detection is the same signature logic as `scripts/card-scan.mjs`. Proven against
a production app from a scratch harness (2026-09-28): self-test green, 284 violations baselined
across 148 files, a lowered count failed with the file:line, a raised one failed "lower it".

```ts
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * <State the card set and the one shell, e.g. "Cards are Section (titled), StatTile, Notice,
 * ChoiceCard, ActionCard; the shell - radius, border, surface, shadow, padding - is the
 * primitive's, never a call site's." Say what it cannot see: a shell built in a helper
 * function or a class string held in a variable.>
 *
 * Backlog: card-shells-baseline.json. Regenerate with
 *   UPDATE_CARD_SHELL_BASELINE=1 npx vitest run tests/unit/card-shells.test.ts
 */

// ---- set these from the repo -------------------------------------------------------------
const DIRS = ["src", "app"];
const EXEMPT_DIRS = ["src/components/ui/" /* primitives define shells */];
/** Card-like primitives whose shell a call site must not restyle. */
const CARD_PRIMITIVES = new Set(["Card", "Section", "Notice", "StatTile", "ChoiceCard", "ActionCard"]);
// --------------------------------------------------------------------------------------------

const ROOT = resolve(__dirname, "../..");
const BASELINE = resolve(ROOT, "tests/unit/card-shells-baseline.json");
const BOX_TAGS = new Set(["div", "section", "article", "li", "aside", "a", "label", "form", "details", "ul", "dl", "fieldset"]);
const SHELL_TOKEN = /^(rounded|border(?!-[trblxy]\b)|bg-|shadow|p[xytrbl]?-(\d|\[))/;

type Opening = ts.JsxOpeningElement | ts.JsxSelfClosingElement;
function classText(el: Opening): string {
  const a = el.attributes.properties.find((p): p is ts.JsxAttribute => ts.isJsxAttribute(p) && ts.isIdentifier(p.name) && p.name.text === "className");
  if (!a?.initializer) return "";
  const parts: string[] = [];
  const visit = (n: ts.Node): void => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) parts.push(n.text);
    if (ts.isTemplateExpression(n)) parts.push(n.head.text, ...n.templateSpans.map((s) => s.literal.text));
    ts.forEachChild(n, visit);
  };
  visit(a.initializer);
  return parts.join(" ");
}
/** Resting utilities only: hover:/sm:/data-[..]: variants are dropped. */
const resting = (cls: string) => cls.split(/\s+/).filter((t) => t && !/:/.test(t.replace(/\[[^\]]*\]/g, "")));

function scan(file: string, source: string): { violations: string[]; boxes: number } {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const violations: string[] = [];
  let boxes = 0;
  const visit = (n: ts.Node): void => {
    const el = ts.isJsxSelfClosingElement(n) ? n : ts.isJsxElement(n) ? n.openingElement : null;
    if (el) {
      const tag = el.tagName.getText(sf);
      const tokens = resting(classText(el));
      const at = `${file}:${sf.getLineAndCharacterOfPosition(el.getStart(sf)).line + 1} <${tag}>`;
      if (BOX_TAGS.has(tag)) {
        const rounded = tokens.some((t) => /^rounded(-(sm|md|lg|xl|2xl|3xl|\[.+\]))?$/.test(t));
        const framed = tokens.some((t) => /^border(-(2|4|8|dashed|dotted|\[\d+px\]))?$/.test(t)) && !tokens.some((t) => /^border-(0|none)$/.test(t));
        const control = tokens.some((t) => /^(inline-flex|size-\d|h-(5|6|7|8|9|10))$/.test(t));
        if (rounded && framed && !control) { boxes++; violations.push(`${at} hand-built card shell - use a card primitive`); }
      }
      if (CARD_PRIMITIVES.has(tag)) {
        const override = tokens.filter((t) => SHELL_TOKEN.test(t));
        if (override.length) violations.push(`${at} restyles the primitive's shell (${override.join(" ")})`);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return { violations, boxes };
}

const files = DIRS.flatMap((dir) => readdirSync(resolve(ROOT, dir), { recursive: true, encoding: "utf8" })
  .map((f) => `${dir}/${f.split("\\").join("/")}`).filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx")))
  .filter((f) => !EXEMPT_DIRS.some((d) => f.startsWith(d))).sort();
const results = files.map((file) => ({ file, ...scan(file, readFileSync(resolve(ROOT, file), "utf8")) }));
const current: Record<string, number> = Object.fromEntries(results.filter((r) => r.violations.length).map((r) => [r.file, r.violations.length]));
if (process.env.UPDATE_CARD_SHELL_BASELINE === "1") writeFileSync(BASELINE, `${JSON.stringify({ files: current }, null, 2)}\n`);
const baseline: { files: Record<string, number> } = JSON.parse(readFileSync(BASELINE, "utf8"));

describe("card shells", () => {
  it("catches a hand-built shell and a restyled primitive", () => {
    // The guard's own guard.
    const count = (jsx: string) => scan("x.tsx", `const a = ${jsx};`).violations.length;
    expect(count('<div className="rounded-lg border bg-card p-4">x</div>')).toBe(1);
    expect(count('<section className={cn("rounded-md border border-border", x)}>x</section>')).toBe(1);
    expect(count('<Card className="p-6 shadow-sm">x</Card>')).toBe(1);
    // A control, a divider, a borderless box, a layout class on a primitive: pass.
    expect(count('<div className="inline-flex h-8 rounded-md border">x</div>')).toBe(0);
    expect(count('<div className="border-b pb-2">x</div>')).toBe(0);
    expect(count('<div className="rounded-lg bg-muted p-4">x</div>')).toBe(0);
    expect(count('<Card className="col-span-2">x</Card>')).toBe(0);
  });
  it("scans the whole component tree", () => {
    expect(files.length).toBeGreaterThan(100);
  });
  it("adds no new hand-built card shell or restyled primitive", () => {
    expect(results.flatMap((r) => (r.violations.length > (baseline.files[r.file] ?? 0) ? r.violations : []))).toEqual([]);
  });
  it("keeps the baseline honest as shells are replaced", () => {
    expect(Object.entries(baseline.files).filter(([f, n]) => (current[f] ?? 0) < n).map(([f, n]) => `${f}: baseline ${n}, now ${current[f] ?? 0} - lower it`)).toEqual([]);
  });
});
```

A framed box that is genuinely not a card (a code block, an image frame, a popover panel built
by hand) either moves to the primitive it really is, or stays in the baseline with a comment in
the file that explains it - never widen the detection to dodge it.
