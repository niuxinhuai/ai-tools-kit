import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "../src/env.js";
import { runTool, streamTool } from "../src/run.js";
import { languages, tools } from "../src/tools.js";
import { listProviders, resolveProvider } from "../src/providers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
loadEnv(path.join(rootDir, ".env"));
const publicDir = path.join(rootDir, "public");
const port = Number(process.env.PORT || 5177);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/api/meta") {
      return sendJson(response, {
        tools,
        languages,
        providers: listProviders(),
        activeProvider: publicProviderInfo()
      });
    }

    if (request.method === "POST" && request.url === "/api/run") {
      const payload = await readBody(request);
      const result = await runTool(payload);
      return sendJson(response, result);
    }

    if (request.method === "POST" && request.url === "/api/run-stream") {
      const payload = await readBody(request);
      return sendEventStream(response, streamTool(payload));
    }

    if (request.method === "GET") {
      return serveStatic(request, response);
    }

    sendJson(response, { error: "Method not allowed" }, 405);
  } catch (error) {
    sendJson(response, { error: error.message || "Unexpected error" }, 500);
  }
});

server.listen(port, () => {
  console.log(`AI Tools Kit is running at http://localhost:${port}`);
});

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://localhost:${port}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(publicDir, requestedPath));

  if (!filePath.startsWith(publicDir)) {
    return sendJson(response, { error: "Forbidden" }, 403);
  }

  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(content);
  } catch {
    sendJson(response, { error: "Not found" }, 404);
  }
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(response, body, status = 200) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function sendEventStream(response, events) {
  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });
  try {
    for await (const event of events) {
      response.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  } catch (error) {
    response.write(`data: ${JSON.stringify({ type: "error", error: error.message || "Unexpected error" })}\n\n`);
  } finally {
    response.end();
  }
}

function publicProviderInfo() {
  const provider = resolveProvider();
  return {
    name: provider.name,
    model: provider.model,
    baseUrl: provider.baseUrl
  };
}
