// Clones every template in catalog.mjs into the templates directory. Already-cloned apps are
// left alone - nothing here pulls, resets or deletes. Dependencies install on first open.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { isAbsolute, join } from "node:path";

import { APPS } from "../catalog.mjs";

const HERE = join(import.meta.dirname, "..");
const TEMPLATES_DIR = process.env.TEMPLATES_DIR
  ? (isAbsolute(process.env.TEMPLATES_DIR) ? process.env.TEMPLATES_DIR : join(HERE, process.env.TEMPLATES_DIR))
  : join(HERE, "templates");

mkdirSync(TEMPLATES_DIR, { recursive: true });

let failed = 0;
for (const app of APPS) {
  if (app.local) continue; // ships in this repo, nothing to clone
  const dir = join(TEMPLATES_DIR, app.dir);
  if (existsSync(dir)) {
    console.log(`have    ${app.dir}`);
    continue;
  }
  console.log(`cloning ${app.dir} <- ${app.repo}`);
  const result = spawnSync("git", ["clone", "--depth", "1", app.repo, dir], { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`FAILED  ${app.dir} (git exited with ${result.status})`);
    failed += 1;
  }
}

console.log(`\nTemplates in ${TEMPLATES_DIR}`);
if (failed) {
  console.error(`${failed} of ${APPS.length} failed to clone`);
  process.exit(1);
}
