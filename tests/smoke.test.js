import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expandFilePatterns, formatResult } from "../src/files.js";
import { runTool, streamTool } from "../src/run.js";
import { tools } from "../src/tools.js";
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

console.log("Smoke tests passed.");
