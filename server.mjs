// Local switcher for the app templates in catalog.mjs. Runs one app at a time with its own
// dev server and shows it in a frame, so dozens of apps never sit in memory at once.
// Local use only: the Square UI licence forbids republishing its templates anywhere.
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { REPOS, SQUARE_UI } from "./catalog.mjs";

const PORT = 3300;
const FIRST_APP_PORT = 3301;
const READY_TIMEOUT_MS = 180_000;
const POLL_MS = 1_000;
const LOG_LINES = 40;
const IS_WINDOWS = process.platform === "win32";
const HERE = import.meta.dirname;
const SQUARE_ROOT = join(HERE, SQUARE_UI.dir);
const SQUARE_APPS_DIR = join(SQUARE_ROOT, "templates-baseui");

// Name, description and hosted demo per Square UI app, from the free-templates table in its
// README. An app missing from the table keeps null fields and the UI shows its folder name.
function readSquareCatalog() {
  const catalog = new Map();
  const readme = readFileSync(join(SQUARE_ROOT, "README.md"), "utf8");
  for (const line of readme.split(/\r?\n/)) {
    if (!line.startsWith("| **")) continue;
    const cells = line.split("|").map((cell) => cell.trim());
    const source = cells.find((cell) => cell.includes("/templates-baseui/"));
    const id = source?.match(/\/templates-baseui\/([^)/]+)\)/)?.[1];
    if (!id) continue;
    catalog.set(id, {
      name: cells[1].replaceAll("**", ""),
      description: cells[2],
      demo: cells[3].match(/\((https?:\/\/[^)]+)\)/)?.[1] ?? null,
    });
  }
  return catalog;
}

function listSquareApps() {
  if (!existsSync(SQUARE_APPS_DIR)) return [];
  const catalog = readSquareCatalog();
  return readdirSync(SQUARE_APPS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(SQUARE_APPS_DIR, entry.name, "package.json")))
    .map((entry) => entry.name)
    .sort()
    .map((id) => ({
      group: SQUARE_UI.group,
      id: `square-${id}`,
      dir: join(SQUARE_APPS_DIR, id),
      name: catalog.get(id)?.name ?? null,
      description: catalog.get(id)?.description ?? null,
      demo: catalog.get(id)?.demo ?? null,
    }));
}

function listApps() {
  const repos = REPOS.map((repo) => ({ ...repo, dir: join(HERE, repo.dir) }));
  return [...repos, ...listSquareApps()].map((app, index) => ({ ...app, port: FIRST_APP_PORT + index }));
}

function installCommand(dir) {
  if (existsSync(join(dir, "pnpm-lock.yaml"))) return ["pnpm", ["install", "--frozen-lockfile"]];
  if (existsSync(join(dir, "bun.lock"))) return ["bun", ["install", "--frozen-lockfile"]];
  if (existsSync(join(dir, "package-lock.json"))) return ["npm", ["ci"]];
  throw new Error("no pnpm, bun or npm lockfile, so the install would not be reproducible");
}

function devCommand(app) {
  let args = app.dev;
  if (!args) {
    const pkg = JSON.parse(readFileSync(join(app.dir, "package.json"), "utf8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps.next) args = ["next", "dev", "-p", "{port}"];
    else if (deps.vite) args = ["vite", "--port", "{port}", "--strictPort"];
    else throw new Error("neither Next.js nor Vite; add a dev command for it in catalog.mjs");
  }
  const [bin, ...rest] = args.map((arg) => arg.replace("{port}", String(app.port)));
  return [join(app.dir, "node_modules", ".bin", bin), rest];
}

const apps = listApps();
let current = null;

function spawnIn(command, args, session) {
  const child = spawn(command, args, { cwd: session.app.dir, shell: IS_WINDOWS });
  const push = (chunk) => {
    for (const line of chunk.toString().split(/\r?\n/)) if (line.trim()) session.log.push(line);
    session.log.splice(0, Math.max(0, session.log.length - LOG_LINES));
  };
  child.stdout.on("data", push);
  child.stderr.on("data", push);
  session.child = child;
  return child;
}

function killTree(child) {
  if (!child || child.exitCode !== null) return;
  if (IS_WINDOWS) spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
  else child.kill();
}

function fail(session, message) {
  if (session.status === "stopped") return;
  session.status = "error";
  session.error = message;
  killTree(session.child);
}

function install(session) {
  const [command, args] = installCommand(session.app.dir);
  return new Promise((resolve, reject) => {
    const child = spawnIn(command, args, session);
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`)),
    );
  });
}

async function waitForHttp(session) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (current === session && session.status === "starting") {
    if (Date.now() > deadline) throw new Error(`no response on port ${session.app.port} after ${READY_TIMEOUT_MS / 1000}s`);
    try {
      // The first request also triggers the dev compile, so the frame loads warm.
      const res = await fetch(`http://localhost:${session.app.port}${session.app.path ?? "/"}`);
      if (res.status < 500) return;
      throw new Error(`the app answered HTTP ${res.status}`);
    } catch (err) {
      if (err.message.startsWith("the app answered")) throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}

async function start(app) {
  if (current?.app.id === app.id && current.status !== "error") return;
  stop();
  const session = { app, child: null, status: "starting", error: null, log: [] };
  current = session;
  try {
    if (!existsSync(join(app.dir, "package.json"))) throw new Error(`not cloned: ${app.dir}`);
    if (!existsSync(join(app.dir, "node_modules"))) {
      session.status = "installing";
      await install(session);
      if (current !== session) return;
      session.status = "starting";
    }
    const [command, args] = devCommand(app);
    const child = spawnIn(command, args, session);
    child.on("exit", (code) => fail(session, `the dev server exited with code ${code}`));
    await waitForHttp(session);
    if (current === session && session.status === "starting") session.status = "ready";
  } catch (err) {
    fail(session, err.message);
  }
}

function stop() {
  if (!current) return;
  current.status = "stopped";
  killTree(current.child);
  current = null;
}

function snapshot() {
  return {
    apps: apps.map(({ dir, dev, ...app }) => app),
    current: current && {
      id: current.app.id,
      port: current.app.port,
      status: current.status,
      error: current.error,
      log: current.log,
    },
  };
}

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === "GET" && url.pathname === "/") {
    return send(res, 200, readFileSync(join(HERE, "index.html")), "text/html; charset=utf-8");
  }
  if (req.method === "GET" && url.pathname === "/api/state") return send(res, 200, snapshot());
  if (req.method === "POST" && url.pathname.startsWith("/api/start/")) {
    const app = apps.find((candidate) => candidate.id === url.pathname.slice("/api/start/".length));
    if (!app) return send(res, 404, { error: "unknown app" });
    start(app);
    return send(res, 202, snapshot());
  }
  if (req.method === "POST" && url.pathname === "/api/stop") {
    stop();
    return send(res, 200, snapshot());
  }
  send(res, 404, { error: "not found" });
});

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => {
    stop();
    process.exit(0);
  });
}
process.on("exit", stop);

server.listen(PORT, () => {
  console.log(`Template switcher: http://localhost:${PORT} (${apps.length} apps)`);
});
