#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { loadEnv } from "../src/env.js";
import { expandFilePatterns, formatResult, outputFileName } from "../src/files.js";
import { runTool } from "../src/run.js";
import { buildToolPrompt, tools, validateCustomTools } from "../src/tools.js";
import { diagnoseProvider, listProviders } from "../src/providers.js";

loadEnv();
const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

if (args.list) {
  console.log(tools.map((tool) => `${tool.id}\t${tool.title.en}\t${tool.title.zh}`).join("\n"));
  process.exit(0);
}

if (args.providers) {
  console.log(listProviders().join("\n"));
  process.exit(0);
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

if (args.validateTools) {
  const validation = validateCustomTools(args.customTools);
  console.log(JSON.stringify(validation, null, 2));
  process.exit(validation.ok ? 0 : 1);
}

try {
  if (args.printPrompt) {
    const input = await resolveInput(args);
    console.log(buildToolPrompt({
      toolId: args.tool || "rewrite",
      input,
      option: args.option,
      language: args.lang || args.language || "zh"
    }));
    process.exit(0);
  }

  if (args.files) {
    const summary = await runBatch(args);
    process.exit(summary.failed ? 1 : 0);
  }

  const input = await resolveInput(args);
  const result = await runTool({
    toolId: args.tool || "rewrite",
    input,
    option: args.option,
    language: args.lang || args.language || "zh",
    provider: {
      provider: args.provider,
      model: args.model,
      baseUrl: args.baseUrl,
      apiKey: args.apiKey
    },
    temperature: args.temperature
  });

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(result.output);
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}

async function runBatch(options) {
  const patterns = flattenValues(options.files);
  const files = await expandFilePatterns(patterns);
  if (!files.length) {
    throw new Error(`No files matched: ${patterns.join(", ")}`);
  }

  const format = options.format || (options.json ? "json" : "md");
  const results = [];
  const failures = [];
  if (options.out) {
    await fs.mkdir(options.out, { recursive: true });
  }

  for (const file of files) {
    try {
      const input = await fs.readFile(file, "utf8");
      const result = await runTool({
        toolId: options.tool || "summarize",
        input,
        option: options.option,
        language: options.lang || options.language || "zh",
        provider: {
          provider: options.provider,
          model: options.model,
          baseUrl: options.baseUrl,
          apiKey: options.apiKey
        },
        temperature: options.temperature
      });
      results.push({ file, ...result });

      if (options.out) {
        const extension = format === "json" ? "json" : format === "txt" ? "txt" : "md";
        const outputPath = path.join(options.out, outputFileName(file, extension));
        await fs.writeFile(outputPath, formatResult({ file, ...result }, format), "utf8");
        console.error(`Wrote ${outputPath}`);
      } else {
        console.log(formatResult({ file, ...result }, format));
      }
    } catch (error) {
      failures.push({ file, error: error.message });
      console.error(`Failed ${file}: ${error.message}`);
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

async function resolveInput(options) {
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

function printHelp() {
  console.log(`AI Tools Kit CLI

Usage:
  ai-tools --list
  ai-tools --providers
  ai-tools --doctor --provider deepseek
  ai-tools --validate-tools
  ai-tools --tool rewrite --input "Draft this" --print-prompt
  ai-tools --tool rewrite --input "Make this better" --lang en
  cat notes.md | ai-tools --tool summarize --option structured --lang zh
  ai-tools --tool code-explain --file ./snippet.js --provider ollama --model llama3.1
  ai-tools --tool summarize --files "docs/*.md" --out summaries --format md

Options:
  --tool <id>          Tool id. Defaults to rewrite.
  --option <value>     Tool mode. Defaults to the tool's first option.
  --input <text>       Inline input.
  --file <path>        Read input from file.
  --files <patterns>   Batch mode. Supports comma-separated patterns and simple * / ** globs.
  --out <dir>          Write batch results to a directory.
  --format <md|txt|json>
  --lang <zh|en|bilingual>
  --provider <name>    openai, deepseek, qwen, doubao, moonshot, gemini, anthropic, ollama, mock.
  --model <name>       Override model.
  --base-url <url>     Override provider base URL.
  --api-key <key>      Override provider API key.
  --temperature <num>  Defaults to 0.4.
  --doctor             Print provider configuration diagnostics.
  --validate-tools     Validate tools/custom.json or --custom-tools.
  --custom-tools <path>
  --print-prompt       Print the final prompt without calling a provider.
  --fail-fast          Stop batch mode at the first failed file.
  --json               Print full JSON result.
`);
}
