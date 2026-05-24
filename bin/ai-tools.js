#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { cacheKey, clearCache, defaultCachePath, readCache, shouldUseCache, writeCache } from "../src/cache.js";
import { loadProjectConfig, mergeProjectConfig, projectConfigFileName, sampleProjectConfig, writeProjectConfig } from "../src/config.js";
import { loadEnv } from "../src/env.js";
import { expandFilePatterns, formatResult, outputFileName } from "../src/files.js";
import { runChunkedTool, runTool, runWorkflow } from "../src/run.js";
import { buildToolPrompt, tools, validateCustomTools } from "../src/tools.js";
import { diagnoseProvider, listProviders } from "../src/providers.js";

loadEnv();
const rawArgs = parseArgs(process.argv.slice(2));

if (rawArgs.help) {
  printHelp();
  process.exit(0);
}

if (rawArgs.initConfig) {
  try {
    const configPath = rawArgs.config || projectConfigFileName;
    const targetPath = await writeProjectConfig(configPath, sampleProjectConfig(), { force: Boolean(rawArgs.force) });
    console.log(`Wrote ${targetPath}`);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

let args;
try {
  const projectConfig = await loadProjectConfig({
    configPath: rawArgs.config === true ? undefined : rawArgs.config,
    disabled: Boolean(rawArgs.noConfig)
  });
  args = mergeProjectConfig(rawArgs, projectConfig.config);
  args.configPath = projectConfig.path;
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}

if (args.list) {
  console.log(tools.map((tool) => `${tool.id}\t${tool.title.en}\t${tool.title.zh}`).join("\n"));
  process.exit(0);
}

if (args.providers) {
  console.log(listProviders().join("\n"));
  process.exit(0);
}

if (args.clearCache) {
  await clearCache(args.cacheFile || defaultCachePath());
  console.log(`Cleared cache: ${args.cacheFile || defaultCachePath()}`);
  process.exit(0);
}

if (args.init) {
  try {
    await initEnv(args);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

if (args.doctor) {
  const status = diagnoseProvider({
    provider: args.provider,
    model: args.model,
    baseUrl: args.baseUrl,
    apiKey: args.apiKey
  });
  console.log(JSON.stringify(status, null, 2));
  process.exit(status.ok || status.level === "warning" ? 0 : 1);
}

if (args.testProvider) {
  try {
    await testProvider(args);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

if (args.validateTools) {
  const validation = validateCustomTools(args.customTools);
  console.log(JSON.stringify(validation, null, 2));
  process.exit(validation.ok ? 0 : 1);
}

try {
  if (args.workflow) {
    const result = await runWorkflowCommand(args);
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(result.output);
    }
    process.exit(0);
  }

  if (args.printPrompt) {
    const input = await resolveInput(args);
    console.log(buildToolPrompt({
      toolId: args.tool || "rewrite",
      input,
      option: args.option,
      language: args.lang || args.language || "zh",
      variables: readVariables(args)
    }));
    process.exit(0);
  }

  if (args.files) {
    if (args.mergeFiles) {
      const input = await resolveInput(args);
      const result = await runToolMaybeCached(buildRunPayload(args, input, args.tool || "summarize"), args);
      if (args.out) {
        await fs.mkdir(args.out, { recursive: true });
        const outputPath = path.join(args.out, `merged.${args.format === "txt" ? "txt" : args.format === "json" ? "json" : "md"}`);
        await fs.writeFile(outputPath, formatResult({ file: "merged", ...result }, args.format || "md"), "utf8");
        console.error(`Wrote ${outputPath}`);
      } else if (args.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(result.output);
      }
      process.exit(0);
    }
    const summary = await runBatch(args);
    process.exit(summary.failed ? 1 : 0);
  }

  const input = await resolveInput(args);
  const result = await runToolMaybeCached(buildRunPayload(args, input, args.tool || "rewrite"), args);

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(result.output);
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}

async function runWorkflowCommand(options) {
  const workflowPath = path.resolve(options.workflow);
  const workflow = JSON.parse(await fs.readFile(workflowPath, "utf8"));
  const input = await resolveInput(options);
  const result = await runWorkflow({
    steps: workflow.steps,
    input,
    provider: {
      provider: options.provider || workflow.provider,
      model: options.model || workflow.model,
      baseUrl: options.baseUrl || workflow.baseUrl,
      apiKey: options.apiKey
    },
    language: options.lang || options.language || workflow.language || "zh",
    temperature: options.temperature ?? workflow.temperature,
    fallbackProviders: options.fallbackProviders || workflow.fallbackProviders,
    variables: { ...(workflow.variables || {}), ...readVariables(options) }
  });

  if (options.out) {
    await fs.mkdir(options.out, { recursive: true });
    const outputPath = path.join(options.out, `${path.parse(workflowPath).name}.md`);
    await fs.writeFile(outputPath, workflowMarkdown(workflow, result), "utf8");
    console.error(`Wrote ${outputPath}`);
  }

  return result;
}

async function initEnv(options) {
  const envPath = path.resolve(options.env || ".env");
  const exists = await fileExists(envPath);
  if (exists && !options.force) {
    throw new Error(`${envPath} already exists. Use --force to overwrite.`);
  }

  const interactive = process.stdin.isTTY && process.stdout.isTTY && !options.yes;
  const answers = {};
  let rl;
  if (interactive) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }

  const provider = options.provider || await ask(rl, "Provider (mock/openai/deepseek/qwen/ollama)", "mock");
  const model = options.model || await ask(rl, "Model (leave empty for provider default)", "");
  const baseUrl = options.baseUrl || await ask(rl, "Base URL override (optional)", "");
  const includeToken = options.withApiToken || await askBoolean(rl, "Generate AI_TOOLS_API_TOKEN?", false);

  if (rl) {
    rl.close();
  }

  const lines = [
    `AI_PROVIDER=${provider}`,
    model ? `AI_MODEL=${model}` : "AI_MODEL=",
    baseUrl ? `AI_BASE_URL=${baseUrl}` : "AI_BASE_URL=",
    "OPENAI_API_KEY=",
    "DEEPSEEK_API_KEY=",
    "QWEN_API_KEY=",
    "DOUBAO_API_KEY=",
    "MOONSHOT_API_KEY=",
    "GEMINI_API_KEY=",
    "ANTHROPIC_API_KEY=",
    "OLLAMA_BASE_URL=http://localhost:11434",
    includeToken ? `AI_TOOLS_API_TOKEN=${crypto.randomBytes(24).toString("hex")}` : "AI_TOOLS_API_TOKEN=",
    "PORT=5177",
    ""
  ];

  await fs.writeFile(envPath, lines.join("\n"), "utf8");
  console.log(`Wrote ${envPath}`);
}

async function testProvider(options) {
  const result = await runTool(buildRunPayload({
    ...options,
    tool: "rewrite",
    option: "shorten",
    lang: "en",
    temperature: 0
  }, "Provider connectivity test.", "rewrite"));
  console.log(JSON.stringify({
    ok: true,
    provider: result.provider,
    outputPreview: result.output.slice(0, 240)
  }, null, 2));
}

async function runBatch(options) {
  const patterns = flattenValues(options.files);
  const files = await expandFilePatterns(patterns);
  if (!files.length) {
    throw new Error(`No files matched: ${patterns.join(", ")}`);
  }

  const format = options.format || (options.json ? "json" : "md");
  const retries = normalizeRetries(options.retries);
  const results = [];
  const failures = [];
  if (options.out) {
    await fs.mkdir(options.out, { recursive: true });
  }

  for (const file of files) {
    try {
      const input = await fs.readFile(file, "utf8");
      const result = await runWithRetries(() => runToolMaybeCached(buildRunPayload(options, input, options.tool || "summarize"), options), {
        retries,
        label: file
      });
      const item = { file, attempts: result.attempts, ...result.value };
      results.push(item);

      if (options.out) {
        const extension = format === "json" ? "json" : format === "jsonl" ? "jsonl" : format === "txt" ? "txt" : "md";
        const outputPath = path.join(options.out, outputFileName(file, extension));
        await fs.writeFile(outputPath, formatResult(item, format), "utf8");
        console.error(`Wrote ${outputPath}`);
      } else {
        process.stdout.write(formatResult(item, format));
      }
    } catch (error) {
      failures.push({ file, error: error.message, attempts: retries + 1 });
      console.error(`Failed ${file} after ${retries + 1} attempt(s): ${error.message}`);
      if (options.failFast) {
        break;
      }
    }
  }

  const summary = {
    total: files.length,
    succeeded: results.length,
    failed: failures.length,
    failures
  };
  console.error(`Batch summary: ${summary.succeeded}/${summary.total} succeeded, ${summary.failed} failed.`);

  if (options.out && options.json) {
    console.log(JSON.stringify({ summary, results }, null, 2));
  }
  if (failures.length) {
    process.exitCode = 1;
  }
  return summary;
}

async function runToolMaybeCached(payload, options) {
  if (!shouldUseCache(options)) {
    return runTool(payload);
  }

  const filePath = options.cacheFile || defaultCachePath();
  const cache = await readCache(filePath);
  const key = cacheKey({
    toolId: payload.toolId,
    input: payload.input,
    option: payload.option,
    language: payload.language,
    provider: payload.provider?.provider,
    model: payload.provider?.model,
    baseUrl: payload.provider?.baseUrl,
    temperature: payload.temperature,
    fallbackProviders: payload.fallbackProviders,
    variables: payload.variables,
    chunkSize: options.chunkSize,
    chunkOverlap: options.chunkOverlap
  });

  if (cache[key]) {
    console.error(`Cache hit: ${key.slice(0, 12)}`);
    return cache[key].result;
  }

  const result = options.chunkSize
    ? await runChunkedTool({
      ...payload,
      chunkSize: options.chunkSize,
      chunkOverlap: options.chunkOverlap
    })
    : await runTool(payload);
  cache[key] = {
    createdAt: new Date().toISOString(),
    result
  };
  await writeCache(cache, filePath);
  console.error(`Cache stored: ${key.slice(0, 12)}`);
  return result;
}

async function resolveInput(options) {
  if (options.files && options.mergeFiles) {
    const files = await expandFilePatterns(flattenValues(options.files));
    if (!files.length) {
      throw new Error(`No files matched: ${flattenValues(options.files).join(", ")}`);
    }
    const parts = [];
    for (const file of files) {
      parts.push(`## File: ${file}\n\n${await fs.readFile(file, "utf8")}`);
    }
    return parts.join("\n\n---\n\n");
  }
  if (options.file) {
    return fs.readFile(options.file, "utf8");
  }
  if (options.input) {
    return options.input;
  }
  if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf8");
  }
  throw new Error("Provide --input, --file, or pipe text through stdin.");
}

function buildRunPayload(options, input, defaultTool) {
  return {
    toolId: options.tool || defaultTool,
    input,
    option: options.option,
    language: options.lang || options.language || "zh",
    provider: {
      provider: options.provider,
      model: options.model,
      baseUrl: options.baseUrl,
      apiKey: options.apiKey
    },
    temperature: options.temperature,
    fallbackProviders: options.fallbackProviders,
    variables: readVariables(options)
  };
}

async function runWithRetries(task, { retries = 0, label = "task" } = {}) {
  let lastError;
  const attempts = retries + 1;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const value = await task();
      if (attempt > 1) {
        console.error(`Succeeded ${label} on attempt ${attempt}/${attempts}`);
      }
      return { value, attempts: attempt };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        console.error(`Retrying ${label} after attempt ${attempt}/${attempts}: ${error.message}`);
      }
    }
  }
  throw lastError;
}

function normalizeRetries(value) {
  const retries = Number(value || 0);
  if (!Number.isFinite(retries) || retries < 0) {
    throw new Error("--retries must be a non-negative number.");
  }
  return Math.floor(retries);
}

function workflowMarkdown(workflow, result) {
  return [
    `# ${workflow.name || "AI Tools Workflow"}`,
    "",
    ...result.steps.flatMap((step) => [
      `## ${step.index}. ${step.name}`,
      "",
      `- Tool: ${step.toolId}`,
      `- Option: ${step.option}`,
      `- Provider: ${step.provider.name}`,
      "",
      step.output,
      ""
    ]),
    "## Final Output",
    "",
    result.output,
    ""
  ].join("\n");
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") result.help = true;
    else if (arg === "--list") result.list = true;
    else if (arg === "--providers") result.providers = true;
    else if (arg === "--json") result.json = true;
    else if (arg.startsWith("--")) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        result[key] = true;
      } else {
        if (result[key] === undefined) {
          result[key] = next;
        } else if (Array.isArray(result[key])) {
          result[key].push(next);
        } else {
          result[key] = [result[key], next];
        }
        index += 1;
      }
    }
  }
  return result;
}

function flattenValues(value) {
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) => String(item).split(",")).map((item) => item.trim()).filter(Boolean);
}

function parseVariables(value) {
  const entries = Array.isArray(value) ? value : value ? [value] : [];
  return entries.reduce((variables, entry) => {
    const equalsIndex = entry.indexOf("=");
    if (equalsIndex <= 0) {
      throw new Error(`Invalid --var "${entry}". Use --var key=value.`);
    }
    const key = entry.slice(0, equalsIndex).trim();
    const itemValue = entry.slice(equalsIndex + 1);
    if (!/^[A-Za-z_][\w-]*$/.test(key)) {
      throw new Error(`Invalid variable name "${key}".`);
    }
    variables[key] = itemValue;
    return variables;
  }, {});
}

function readVariables(options) {
  return {
    ...(options.configVariables || {}),
    ...parseVariables(options.var)
  };
}

async function ask(rl, question, defaultValue) {
  if (!rl) {
    return defaultValue;
  }
  const answer = await rl.question(`${question}${defaultValue ? ` [${defaultValue}]` : ""}: `);
  return answer.trim() || defaultValue;
}

async function askBoolean(rl, question, defaultValue) {
  if (!rl) {
    return defaultValue;
  }
  const answer = await rl.question(`${question} ${defaultValue ? "[Y/n]" : "[y/N]"}: `);
  if (!answer.trim()) {
    return defaultValue;
  }
  return ["y", "yes"].includes(answer.trim().toLowerCase());
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function printHelp() {
  console.log(`AI Tools Kit CLI

Usage:
  ai-tools --list
  ai-tools --providers
  ai-tools --init
  ai-tools --init-config
  ai-tools --doctor --provider deepseek
  ai-tools --test-provider --provider mock
  ai-tools --validate-tools
  ai-tools --tool rewrite --input "Draft this" --print-prompt
  ai-tools --tool email-reply --input "Thanks" --var audience=customer --var tone=friendly
  ai-tools --tool rewrite --input "Make this better" --lang en
  cat notes.md | ai-tools --tool summarize --option structured --lang zh
  ai-tools --tool code-explain --file ./snippet.js --provider ollama --model llama3.1
  ai-tools --tool summarize --files "docs/*.md" --out summaries --format md
  ai-tools --tool summarize --files "docs/*.md" --merge-files --chunk-size 8000
  ai-tools --workflow workflows/content-pipeline.json --file notes.md
  AI_TOOLS_CACHE=1 ai-tools --tool summarize --file notes.md

Options:
  --tool <id>          Tool id. Defaults to rewrite.
  --option <value>     Tool mode. Defaults to the tool's first option.
  --input <text>       Inline input.
  --file <path>        Read input from file.
  --files <patterns>   Batch mode. Supports comma-separated patterns and simple * / ** globs.
  --merge-files        Merge --files into one input instead of processing each file separately.
  --chunk-size <chars> Split long input and synthesize the chunk results.
  --chunk-overlap <chars>
  --workflow <path>    Run a linear workflow JSON file.
  --out <dir>          Write batch results to a directory.
  --format <md|txt|json|jsonl>
  --lang <zh|en|bilingual>
  --config <path>      Read project defaults from a JSON file. Defaults to nearest .ai-tools-kit.json.
  --no-config          Disable project config lookup.
  --provider <name>    openai, deepseek, qwen, doubao, moonshot, gemini, anthropic, ollama, mock.
  --model <name>       Override model.
  --base-url <url>     Override provider base URL.
  --api-key <key>      Override provider API key.
  --fallback-providers <names> Comma-separated providers to try if the primary provider fails.
  --var <key=value>    Set custom tool template variables. Can be repeated.
  --retries <num>      Retry failed batch items. Defaults to 0.
  --temperature <num>  Defaults to 0.4.
  --init               Create a .env file. Use --yes for defaults and --force to overwrite.
  --init-config        Create a .ai-tools-kit.json project config file.
  --env <path>         Env file path for --init. Defaults to .env.
  --with-api-token     Generate AI_TOOLS_API_TOKEN during --init.
  --yes                Use defaults for --init.
  --force              Overwrite existing env file during --init.
  --test-provider      Send a tiny request to verify the current provider works.
  --cache              Cache CLI results locally.
  --no-cache           Disable cache even when AI_TOOLS_CACHE=1.
  --cache-file <path>  Cache file path. Defaults to ~/.ai-tools-kit/cache.json.
  --clear-cache        Clear the cache file.
  --doctor             Print provider configuration diagnostics.
  --validate-tools     Validate tools/custom.json or --custom-tools.
  --custom-tools <path>
  --print-prompt       Print the final prompt without calling a provider.
  --fail-fast          Stop batch mode at the first failed file.
  --json               Print full JSON result.
`);
}
