import assert from "node:assert/strict";
import { runTool } from "../src/run.js";
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

console.log("Smoke tests passed.");
