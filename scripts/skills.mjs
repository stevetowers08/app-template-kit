// Keeps skills/ and agents/ in step with the skills you actually use.
//
//   node scripts/skills.mjs install [--project] [--only a,b] [--force]
//       Copy this repo's skills into ~/.claude/skills (or ./.claude/skills with --project).
//       New skills are added, identical ones skipped. A skill you have changed locally is left
//       alone unless you pass --force.
//
//   node scripts/skills.mjs status
//       What install would do, without writing anything.
//
//   node scripts/skills.mjs sync [--dry] [--from <dir>]
//       Maintainer only. Pull the skills named in skills.json from your own library
//       (~/.claude/skills by default), strip private details, refuse to write if anything
//       private is left, then replace the copies in skills/ and agents/.
//       Rules: skills.json (public: dropBlocks, leakPatterns) plus ~/.claude/skills-publish.json
//       (private: replace, replaceIn, denyPatterns). The private file never enters this repo,
//       because the text it finds and replaces is the private text.
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, extname, join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const MANIFEST = JSON.parse(readFileSync(join(ROOT, "skills.json"), "utf8"));
const TEXT = new Set([".md", ".mdx", ".txt", ".json", ".mjs", ".js", ".ts", ".tsx", ".sh", ".yaml", ".yml", ".css", ".html"]);

const args = process.argv.slice(2);
const cmd = args[0];
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const expandHome = (p) => (p.startsWith("~") ? join(homedir(), p.slice(1)) : p);

function files(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === ".DS_Store") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...files(full));
    else out.push(full);
  }
  return out.sort();
}

// Line endings differ between Windows checkouts and Unix ones, so compare text without them.
function hashDir(dir) {
  if (!existsSync(dir)) return null;
  const h = createHash("sha256");
  for (const f of files(dir)) {
    h.update(relative(dir, f).replaceAll("\\", "/"));
    const buf = readFileSync(f);
    h.update(TEXT.has(extname(f)) ? buf.toString("utf8").replace(/\r\n/g, "\n") : buf);
  }
  return h.digest("hex");
}

// ---- install / status -------------------------------------------------------------------

function install({ dryRun }) {
  const base = flag("--project") ? join(process.cwd(), ".claude") : join(homedir(), ".claude");
  const only = opt("--only")?.split(",").map((s) => s.trim());
  const force = flag("--force");
  const plan = [];

  for (const kind of ["skills", "agents"]) {
    const srcDir = join(ROOT, kind);
    if (!existsSync(srcDir)) continue;
    for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
      const name = entry.name.replace(/\.md$/, "");
      if (only && !only.includes(name)) continue;
      const src = join(srcDir, entry.name);
      const dest = join(base, kind, entry.name);
      const same = entry.isDirectory()
        ? hashDir(src) === hashDir(dest)
        : existsSync(dest) && readFileSync(src, "utf8").replace(/\r\n/g, "\n") === readFileSync(dest, "utf8").replace(/\r\n/g, "\n");
      const state = !existsSync(dest) ? "new" : same ? "same" : "changed";
      plan.push({ kind, name, src, dest, state, isDir: entry.isDirectory() });
    }
  }

  for (const p of plan) {
    const write = p.state === "new" || (p.state === "changed" && force);
    const label = p.state === "changed" && !force ? "keep (yours differs, --force to replace)" : p.state === "same" ? "up to date" : write ? (dryRun ? "would copy" : "copied") : p.state;
    console.log(`${p.kind.padEnd(6)} ${p.name.padEnd(30)} ${label}`);
    if (!write || dryRun) continue;
    if (p.isDir) rmSync(p.dest, { recursive: true, force: true });
    mkdirSync(dirname(p.dest), { recursive: true });
    cpSync(p.src, p.dest, { recursive: true });
  }
  console.log(`\nTarget: ${base}`);
}

// ---- sync (maintainer) ------------------------------------------------------------------

function dropBlocks(text) {
  const lines = text.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const rule = MANIFEST.dropBlocks.find((r) => lines[i].startsWith(r.startsWith));
    if (!rule) {
      out.push(lines[i]);
      continue;
    }
    if (lines[i].startsWith(">")) {
      // A blockquote: drop every following quoted line, tables inside it included.
      while (i + 1 < lines.length && lines[i + 1].startsWith(">")) i++;
    } else {
      // A list item: drop its indented continuation lines too.
      while (i + 1 < lines.length && /^\s{2,}\S/.test(lines[i + 1])) i++;
    }
    if (i + 1 < lines.length && lines[i + 1].trim() === "" && out.at(-1)?.trim() === "") i++;
  }
  return out.join("\n");
}

const PRIVATE_RULES = join(homedir(), ".claude", "skills-publish.json");

function loadPrivateRules() {
  if (!existsSync(PRIVATE_RULES)) {
    console.error(`Refusing to sync: ${PRIVATE_RULES} not found. It holds the private find-and-replace rules.`);
    process.exit(1);
  }
  const r = JSON.parse(readFileSync(PRIVATE_RULES, "utf8"));
  return { replace: r.replace ?? [], replaceIn: r.replaceIn ?? {}, denyPatterns: r.denyPatterns ?? [] };
}

function scrub(name, text, rules) {
  let t = text.replace(/\r\n/g, "\n");
  t = dropBlocks(t);
  for (const r of rules.replaceIn[name] ?? []) t = t.split(r.from).join(r.to);
  for (const r of rules.replace) t = t.split(r.from).join(r.to);
  return t;
}

function sync() {
  const rules = loadPrivateRules();
  const from = expandHome(opt("--from") ?? "~/.claude");
  const stage = join(tmpdir(), `skills-sync-${process.pid}`);
  rmSync(stage, { recursive: true, force: true });
  const leaks = [];
  const patterns = [...MANIFEST.leakPatterns, ...rules.denyPatterns].map((p) => new RegExp(p, "i"));
  const missing = [];

  const stageFile = (srcFile, destFile, name) => {
    mkdirSync(dirname(destFile), { recursive: true });
    if (!TEXT.has(extname(srcFile))) return cpSync(srcFile, destFile);
    const text = scrub(name, readFileSync(srcFile, "utf8"), rules);
    text.split("\n").forEach((line, n) => {
      for (const p of patterns) if (p.test(line)) leaks.push(`${relative(stage, destFile)}:${n + 1}  [${p.source}]  ${line.trim().slice(0, 120)}`);
    });
    writeFileSync(destFile, text);
  };

  for (const name of MANIFEST.skills) {
    const src = join(from, "skills", name);
    if (!existsSync(src) || !statSync(src).isDirectory()) {
      missing.push(`skills/${name}`);
      continue;
    }
    for (const f of files(src)) stageFile(f, join(stage, "skills", name, relative(src, f)), name);
  }
  for (const name of MANIFEST.agents) {
    const src = join(from, "agents", `${name}.md`);
    if (!existsSync(src)) {
      missing.push(`agents/${name}.md`);
      continue;
    }
    stageFile(src, join(stage, "agents", `${name}.md`), name);
  }

  if (missing.length) console.warn(`not found in ${from}:\n  ${missing.join("\n  ")}`);
  if (leaks.length) {
    console.error(`\nRefusing to sync: ${leaks.length} line(s) still look private. Add a rule to skills.json or fix the source.\n`);
    for (const l of leaks) console.error(`  ${l}`);
    rmSync(stage, { recursive: true, force: true });
    process.exit(1);
  }

  for (const kind of ["skills", "agents"]) {
    const staged = join(stage, kind);
    if (!existsSync(staged)) continue;
    for (const entry of readdirSync(staged)) {
      const dest = join(ROOT, kind, entry);
      const before = entry.endsWith(".md") ? (existsSync(dest) ? readFileSync(dest, "utf8").replace(/\r\n/g, "\n") : null) : hashDir(dest);
      const after = entry.endsWith(".md") ? readFileSync(join(staged, entry), "utf8") : hashDir(join(staged, entry));
      const state = before === null ? "new" : before === after ? "same" : "updated";
      console.log(`${kind.padEnd(6)} ${entry.replace(/\.md$/, "").padEnd(30)} ${state}`);
      if (flag("--dry") || state === "same") continue;
      rmSync(dest, { recursive: true, force: true });
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(join(staged, entry), dest, { recursive: true });
    }
  }
  rmSync(stage, { recursive: true, force: true });

  // Anything in skills/ that the manifest no longer lists is reported, never deleted.
  const listed = new Set(MANIFEST.skills);
  const stray = existsSync(join(ROOT, "skills")) ? readdirSync(join(ROOT, "skills")).filter((d) => !listed.has(d)) : [];
  if (stray.length) console.warn(`\nIn skills/ but not in skills.json (left in place): ${stray.join(", ")}`);
  if (flag("--dry")) console.log("\n--dry: nothing written");
}

if (cmd === "install") install({ dryRun: false });
else if (cmd === "status") install({ dryRun: true });
else if (cmd === "sync") sync();
else {
  console.log("usage: node scripts/skills.mjs install|status|sync  (see the header of this file)");
  process.exit(cmd ? 1 : 0);
}
