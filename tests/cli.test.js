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
const installedToolsFile = path.join(tempDir, "installed-tools.json");
const configDir = path.join(tempDir, "project");
await fs.mkdir(configDir, { recursive: true });
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

const templates = await runCli(["--templates"]);
assert.match(templates.stdout, /developer-tools/);
assert.match(templates.stdout, /product-and-content/);

const installedTemplate = await runCli(["--install-template", "developer-tools", "--custom-tools", installedToolsFile]);
assert.match(installedTemplate.stdout, /"installed": 3/);
const installedTools = JSON.parse(await fs.readFile(installedToolsFile, "utf8"));
assert.equal(installedTools.tools.length, 3);

const duplicateInstall = await runCliAllowFailure(["--install-template", "developer-tools", "--custom-tools", installedToolsFile]);
assert.equal(duplicateInstall.code, 1);
assert.match(duplicateInstall.stderr, /already exists/);

const mergedTemplate = await runCli(["--install-template", "product-and-content", "--custom-tools", installedToolsFile, "--merge-template"]);
assert.match(mergedTemplate.stdout, /"merged": true/);
const mergedTools = JSON.parse(await fs.readFile(installedToolsFile, "utf8"));
assert.equal(mergedTools.tools.length, 6);

const duplicateMerge = await runCliAllowFailure(["--install-template", "developer-tools", "--custom-tools", installedToolsFile, "--merge-template"]);
assert.equal(duplicateMerge.code, 1);
assert.match(duplicateMerge.stderr, /already exists/);

const initConfig = await runCli(["--init-config"], {}, configDir);
assert.match(initConfig.stdout, /Wrote/);
assert.match(await fs.readFile(path.join(configDir, ".ai-tools-kit.json"), "utf8"), /"provider": "mock"/);

const projectConfigFile = path.join(configDir, ".ai-tools-kit.json");
await fs.writeFile(projectConfigFile, JSON.stringify({
  tool: "summarize",
  option: "brief",
  language: "en",
  provider: "mock",
  variables: {
    audience: "operators",
    tone: "focused"
  }
}), "utf8");

const configPrompt = await runCli(["--input", "Config note", "--print-prompt"], {}, configDir);
assert.match(configPrompt.stdout, /Summarize the content with mode "brief"/);

const overridePrompt = await runCli(["--tool", "rewrite", "--input", "Config note", "--print-prompt"], {}, configDir);
assert.match(overridePrompt.stdout, /Rewrite the following content/);

const variablePrompt = await runCli([
  "--tool", "variable-test",
  "--input", "Launch note",
  "--print-prompt"
], { AI_TOOLS_CUSTOM_FILE: customToolsFile }, configDir);
assert.match(variablePrompt.stdout, /Write for operators in a focused tone/);

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

const jsonlBatch = await runCli([
  "--tool", "summarize",
  "--files", sourceFile,
  "--format", "jsonl",
  "--provider", "mock",
  "--lang", "en"
]);
const jsonlRows = jsonlBatch.stdout.trim().split("\n").map((line) => JSON.parse(line));
assert.equal(jsonlRows.length, 1);
assert.equal(jsonlRows[0].file, sourceFile);
assert.equal(jsonlRows[0].attempts, 1);
assert.match(jsonlRows[0].output, /Mock provider/);

const retryFailure = await runCliAllowFailure([
  "--tool", "missing-tool",
  "--files", sourceFile,
  "--format", "jsonl",
  "--provider", "mock",
  "--retries", "2"
]);
assert.equal(retryFailure.code, 1);
assert.match(retryFailure.stderr, /attempt 1\/3/);
assert.match(retryFailure.stderr, /after 3 attempt\(s\)/);

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

async function runCli(args, env = {}, cwd = process.cwd()) {
  return exec("node", [bin, ...args], {
    cwd,
    env: {
      ...process.env,
      AI_PROVIDER: "mock",
      ...env
    }
  });
}

async function runCliAllowFailure(args, env = {}, cwd = process.cwd()) {
  try {
    const result = await runCli(args, env, cwd);
    return { code: 0, ...result };
  } catch (error) {
    return {
      code: error.code,
      stdout: error.stdout || "",
      stderr: error.stderr || ""
    };
  }
}
