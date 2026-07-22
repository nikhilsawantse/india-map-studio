import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const playwrightCli = resolve(root, "node_modules", "@playwright", "test", "cli.js");
const python = process.env.PYTHON || (process.platform === "win32" ? "python" : "python3");
const serverUrl = "http://127.0.0.1:4173/index.html";

function start(command, args, options = {}) {
  return spawn(command, args, {
    cwd: root,
    windowsHide: true,
    ...options,
  });
}

async function waitForServer(server) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`The local test server exited with code ${server.exitCode}.`);
    try {
      const response = await fetch(serverUrl, { cache: "no-store" });
      if (response.ok) return;
    } catch {
      // The server may still be starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`The local test server did not become ready at ${serverUrl}.`);
}

async function run() {
  const server = start(python, ["-m", "http.server", "4173", "--bind", "127.0.0.1"], { stdio: "ignore" });
  try {
    await waitForServer(server);
    const testArguments = process.argv.slice(2);
    if (testArguments[0] === "--") testArguments.shift();
    const tests = start(process.execPath, [playwrightCli, "test", ...testArguments], { stdio: "inherit" });
    const exitCode = await new Promise((resolveExit) => tests.once("exit", (code) => resolveExit(code ?? 1)));
    server.kill();
    server.unref();
    process.exit(exitCode);
  } catch (error) {
    server.kill();
    server.unref();
    console.error(error.message);
    process.exit(1);
  }
}

run();
