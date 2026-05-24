import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const bin = path.resolve("bin/ai-tools.js");

const list = await runCli(["--list"]);
assert.match(list.stdout, /rewrite/);

const prompt = await runCli(["--tool", "rewrite", "--input", "hello", "--lang", "en", "--print-prompt"]);
assert.match(prompt.stdout, /Rewrite the following content/);

const doctor = await runCli(["--doctor", "--provider", "mock"]);
assert.match(doctor.stdout, /"provider": "mock"/);

const provider = await runCli(["--test-provider", "--provider", "mock"]);
assert.match(provider.stdout, /"ok": true/);

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-tools-cli-"));
const sourceFile = path.join(tempDir, "note.md");
const outDir = path.join(tempDir, "out");
await fs.writeFile(sourceFile, "CLI batch test", "utf8");
const customToolsFile = path.join(tempDir, "custom.json");
await fs.writeFile(customToolsFile, JSON.stringify({
  tools: [
    {
      id: "variable-test",
      title: "Variable Test",
      description: "Variable prompt test",
      inputLabel: "Input",
      placeholder: "Input",
      variables: [
        { name: "audience", label: "Audience", required: true },
        { name: "tone", label: "Tone", default: "direct" }
      ],
      promptTemplate: "Write for {{audience}} in a {{tone}} tone.\n\n{{input}}"
    }
  ]
}), "utf8");

const variablePrompt = await runCli([
  "--tool", "variable-test",
  "--input", "Launch note",
  "--print-prompt",
  "--var", "audience=developers",
  "--var", "tone=warm"
], { AI_TOOLS_CUSTOM_FILE: customToolsFile });
assert.match(variablePrompt.stdout, /Write for developers in a warm tone/);

const batch = await runCli([
  "--tool", "summarize",
  "--files", sourceFile,
  "--out", outDir,
  "--format", "txt",
  "--provider", "mock",
  "--lang", "en"
]);
assert.match(batch.stderr, /Batch summary: 1\/1 succeeded/);
assert.match(await fs.readFile(path.join(outDir, "note.txt"), "utf8"), /Mock provider/);

const cacheFile = path.join(tempDir, "cache.json");
await runCli(["--tool", "rewrite", "--input", "cache", "--provider", "mock", "--cache", "--cache-file", cacheFile]);
const cached = await runCli(["--tool", "rewrite", "--input", "cache", "--provider", "mock", "--cache", "--cache-file", cacheFile]);
assert.match(cached.stderr, /Cache hit/);

const workflow = await runCli([
  "--workflow", "workflows/content-pipeline.json",
  "--input", "workflow test",
  "--provider", "mock",
  "--lang", "en"
]);
assert.match(workflow.stdout, /Mock provider/);

console.log("CLI tests passed.");

async function runCli(args, env = {}) {
  return exec("node", [bin, ...args], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      AI_PROVIDER: "mock",
      ...env
    }
  });
}
