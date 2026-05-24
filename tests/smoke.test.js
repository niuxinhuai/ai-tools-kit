import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { cacheKey } from "../src/cache.js";
import { expandFilePatterns, formatResult } from "../src/files.js";
import { runChunkedTool, runTool, runWorkflow, streamTool } from "../src/run.js";
import { buildPromptDebug, buildToolPrompt, tools, validateCustomTools } from "../src/tools.js";
import { listProviders } from "../src/providers.js";

assert.ok(tools.length >= 5, "expected at least five tools");
assert.ok(listProviders().includes("mock"), "expected mock provider");

const result = await runTool({
  toolId: "summarize",
  input: "AI Tools Kit supports a web app, CLI, bilingual output, and pluggable providers.",
  option: "brief",
  language: "en",
  provider: { provider: "mock" }
});

assert.equal(result.toolId, "summarize");
assert.equal(result.provider.name, "mock");
assert.match(result.output, /Mock provider/);
const fallbackResult = await runTool({
  toolId: "rewrite",
  input: "fallback",
  language: "en",
  provider: { provider: "openai-compatible", baseUrl: "http://127.0.0.1:1", apiKey: "x", model: "bad-model" },
  fallbackProviders: "mock"
});
assert.equal(fallbackResult.provider.name, "mock");
assert.equal(fallbackResult.fallbackUsed, true);

const chunks = [];
for await (const event of streamTool({
  toolId: "rewrite",
  input: "hello world",
  language: "en",
  provider: { provider: "mock" }
})) {
  chunks.push(event);
}

assert.equal(chunks[0].type, "meta");
assert.ok(chunks.some((event) => event.type === "chunk"), "expected streamed chunks");
assert.equal(chunks.at(-1).type, "done");

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-tools-kit-"));
await fs.writeFile(path.join(tempDir, "one.md"), "one", "utf8");
await fs.writeFile(path.join(tempDir, "two.txt"), "two", "utf8");
const matched = await expandFilePatterns([path.join(tempDir, "*.md")]);
assert.equal(matched.length, 1);
assert.match(formatResult(result, "md"), /# summarize/);
assert.match(buildToolPrompt({
  toolId: "rewrite",
  input: "hello",
  language: "en"
}), /Rewrite the following content/);
const promptDebug = buildPromptDebug({
  toolId: "rewrite",
  input: "hello",
  language: "en"
});
assert.match(promptDebug.prompt, /Rewrite the following content/);
assert.match(promptDebug.toolPrompt, /Content:/);
assert.equal(promptDebug.system.length, 3);

const validation = validateCustomTools("tools/custom.example.json");
assert.equal(validation.ok, true);
assert.equal(validation.count, 1);
assert.equal(validateCustomTools("tools/templates/product-and-content.json").ok, true);
assert.equal(validateCustomTools("tools/templates/developer-tools.json").ok, true);
const openApi = JSON.parse(await fs.readFile("openapi.json", "utf8"));
assert.equal(openApi.openapi, "3.1.0");
assert.equal(cacheKey({ toolId: "rewrite" }).length, 64);
const chunked = await runChunkedTool({
  toolId: "summarize",
  input: "abcdefg".repeat(200),
  language: "en",
  provider: { provider: "mock" },
  chunkSize: 100,
  chunkOverlap: 10
});
assert.ok(chunked.chunks > 1);
const workflow = await runWorkflow({
  steps: [
    { toolId: "summarize", option: "brief" },
    { toolId: "rewrite", option: "polish" }
  ],
  input: "workflow smoke test",
  language: "en",
  provider: { provider: "mock" }
});
assert.equal(workflow.steps.length, 2);

console.log("Smoke tests passed.");
