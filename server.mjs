// Local switcher for the Square UI templates (Base UI builds). Runs one app at a time with
// `next dev` and shows it in a frame, so twenty apps never sit in memory at once.
// Local use only: the Square UI licence forbids republishing the templates anywhere.
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PORT = 3300;
const FIRST_APP_PORT = 3301;
const READY_TIMEOUT_MS = 180_000;
const POLL_MS = 1_000;
const LOG_LINES = 40;
const IS_WINDOWS = process.platform === "win32";
const SQUARE_ROOT = join(import.meta.dirname, "..", "square-ui");
const APPS_DIR = join(SQUARE_ROOT, "templates-baseui");

// Name, description and hosted demo per app, from the free-templates table in the Square UI
// README. An app missing from the table keeps null fields and the UI shows its folder name.
function readCatalog() {
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

function listApps() {
  const catalog = readCatalog();
  return readdirSync(APPS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(APPS_DIR, entry.name, "package.json")))
    .map((entry) => entry.name)
    .sort()
    .map((id, index) => ({
      id,
      dir: join(APPS_DIR, id),
      port: FIRST_APP_PORT + index,
      name: catalog.get(id)?.name ?? null,
      description: catalog.get(id)?.description ?? null,
      demo: catalog.get(id)?.demo ?? null,
    }));
}

const apps = listApps();
let current = null;

function spawnPnpm(args, session) {
  const child = spawn("pnpm", args, { cwd: session.app.dir, shell: IS_WINDOWS });
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
  return new Promise((resolve, reject) => {
    const child = spawnPnpm(["install", "--frozen-lockfile"], session);
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`pnpm install exited with code ${code}`)),
    );
  });
}

async function waitForHttp(session) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (current === session && session.status === "starting") {
    if (Date.now() > deadline) throw new Error(`no response on port ${session.app.port} after ${READY_TIMEOUT_MS / 1000}s`);
    try {
      // The first request also triggers Next's compile, so the frame loads warm.
      const res = await fetch(`http://localhost:${session.app.port}/`);
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
    if (!existsSync(join(app.dir, "node_modules"))) {
      session.status = "installing";
      await install(session);
      if (current !== session) return;
      session.status = "starting";
    }
    const child = spawnPnpm(["exec", "next", "dev", "-p", String(app.port)], session);
    child.on("exit", (code) => fail(session, `next dev exited with code ${code}`));
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
    apps: apps.map(({ dir, ...app }) => app),
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
    return send(res, 200, readFileSync(join(import.meta.dirname, "index.html")), "text/html; charset=utf-8");
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
  console.log(`Template switcher: http://localhost:${PORT} (${apps.length} apps from ${APPS_DIR})`);
});
