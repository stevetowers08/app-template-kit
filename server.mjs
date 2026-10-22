// Local switcher for the app templates in catalog.mjs. Runs one app at a time with its own
// dev server and shows it in a frame, so the apps never all sit in memory at once.
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

import { APPS } from "./catalog.mjs";

const PORT = Number(process.env.PORT ?? 3300);
const FIRST_APP_PORT = 3301;
const READY_TIMEOUT_MS = 180_000;
const POLL_MS = 1_000;
const LOG_LINES = 40;
const IS_WINDOWS = process.platform === "win32";
const HERE = import.meta.dirname;
// Where the template clones live. `npm run clone` fills this directory; point TEMPLATES_DIR at
// an existing collection to use clones you already have.
const TEMPLATES_DIR = process.env.TEMPLATES_DIR
  ? (isAbsolute(process.env.TEMPLATES_DIR) ? process.env.TEMPLATES_DIR : join(HERE, process.env.TEMPLATES_DIR))
  : join(HERE, "templates");

function listApps() {
  // A `local` app ships in this repo; the rest are clones under TEMPLATES_DIR.
  return APPS.map((app, index) => ({
    ...app,
    dir: join(app.local ? HERE : TEMPLATES_DIR, app.dir),
    port: FIRST_APP_PORT + index,
  }));
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

function runToCompletion(command, args, session) {
  return new Promise((resolve, reject) => {
    const child = spawnIn(command, args, session);
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`)),
    );
  });
}

function install(session) {
  const [command, args] = installCommand(session.app.dir);
  return runToCompletion(command, args, session);
}

// An app whose dev server needs a generated file first (latent-ui writes its looks CSS from a
// script that `predev` would normally run; the switcher starts the dev binary directly).
function prepare(session) {
  const [bin, ...args] = session.app.prepare;
  return runToCompletion(join(session.app.dir, "node_modules", ".bin", bin), args, session);
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

// Dev servers compile each page on its first request, so a first click can sit for a second or
// two with no feedback. Once the app is up, request every same-origin link on its start page,
// one at a time, so those pages are compiled before they are clicked. Server-rendered apps only:
// a client-rendered (Vite) app has no links in its HTML, so this does nothing there.
async function warmLinks(session) {
  const base = `http://localhost:${session.app.port}`;
  const html = await (await fetch(`${base}${session.app.path ?? "/"}`)).text();
  const paths = new Set(
    [...html.matchAll(/href="(\/[^"#?]*)"/g)]
      .map((match) => match[1])
      .filter((path) => !path.startsWith("/_next/") && !/\.[a-z0-9]+$/i.test(path)),
  );
  for (const path of paths) {
    if (current !== session || session.status !== "ready") return;
    await fetch(`${base}${path}`).catch((err) => session.log.push(`warm-up: ${path} failed: ${err.message}`));
  }
  session.log.push(`warm-up: compiled ${paths.size} linked pages`);
}

async function start(app) {
  if (current?.app.id === app.id && current.status !== "error") return;
  stop();
  const session = { app, child: null, status: "starting", error: null, log: [] };
  current = session;
  try {
    if (!existsSync(join(app.dir, "package.json")))
      throw new Error(`not cloned: ${app.dir} - run "npm run clone" (or set TEMPLATES_DIR)`);
    if (!existsSync(join(app.dir, "node_modules"))) {
      session.status = "installing";
      await install(session);
      if (current !== session) return;
      session.status = "starting";
    }
    if (app.prepare) {
      session.status = "preparing";
      await prepare(session);
      if (current !== session) return;
      session.status = "starting";
    }
    const [command, args] = devCommand(app);
    const child = spawnIn(command, args, session);
    child.on("exit", (code) => fail(session, `the dev server exited with code ${code}`));
    await waitForHttp(session);
    if (current === session && session.status === "starting") session.status = "ready";
    warmLinks(session).catch((err) => session.log.push(`warm-up stopped: ${err.message}`));
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
  console.log(`Template switcher: http://localhost:${PORT} (${apps.length} apps from ${TEMPLATES_DIR})`);
});
