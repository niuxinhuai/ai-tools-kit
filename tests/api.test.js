import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = 5199;
const token = "test-token";
const baseUrl = `http://127.0.0.1:${port}`;
let serverOutput = "";
const server = spawn("node", ["server/index.js"], {
  env: {
    ...process.env,
    PORT: String(port),
    AI_PROVIDER: "mock",
    AI_TOOLS_API_TOKEN: token
  },
  stdio: ["ignore", "pipe", "pipe"]
});
server.stdout.on("data", (data) => {
  serverOutput += data.toString();
});
server.stderr.on("data", (data) => {
  serverOutput += data.toString();
});

try {
  await waitForServer();

  const health = await fetchJson("/api/health");
  assert.equal(health.security.apiTokenEnabled, true);

  const meta = await fetchJson("/api/meta");
  assert.ok(meta.tools.length >= 8);

  const denied = await fetch(`${baseUrl}/api/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toolId: "rewrite", input: "hello", language: "en" })
  });
  assert.equal(denied.status, 401);

  const prompt = await fetchJson("/api/prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ toolId: "rewrite", input: "hello", language: "en" })
  });
  assert.match(prompt.prompt, /Rewrite the following content/);

  const run = await fetchJson("/api/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ toolId: "summarize", input: "api test", language: "en", provider: { provider: "mock" } })
  });
  assert.match(run.output, /Mock provider/);

  const openapi = await fetchJson("/openapi.json");
  assert.equal(openapi.openapi, "3.1.0");

  console.log("API tests passed.");
} finally {
  server.kill("SIGTERM");
}

async function fetchJson(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function waitForServer() {
  const started = Date.now();
  while (Date.now() - started < 5000) {
    if (server.exitCode !== null) {
      throw new Error(`Server exited before startup.\n${serverOutput}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`Server did not start in time.\n${serverOutput}`);
}
