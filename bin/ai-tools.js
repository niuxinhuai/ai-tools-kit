#!/usr/bin/env node
import fs from "node:fs/promises";
import process from "node:process";
import { loadEnv } from "../src/env.js";
import { runTool } from "../src/run.js";
import { tools } from "../src/tools.js";
import { listProviders } from "../src/providers.js";

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

try {
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
        result[key] = next;
        index += 1;
      }
    }
  }
  return result;
}

function printHelp() {
  console.log(`AI Tools Kit CLI

Usage:
  ai-tools --list
  ai-tools --providers
  ai-tools --tool rewrite --input "Make this better" --lang en
  cat notes.md | ai-tools --tool summarize --option structured --lang zh
  ai-tools --tool code-explain --file ./snippet.js --provider ollama --model llama3.1

Options:
  --tool <id>          Tool id. Defaults to rewrite.
  --option <value>     Tool mode. Defaults to the tool's first option.
  --input <text>       Inline input.
  --file <path>        Read input from file.
  --lang <zh|en|bilingual>
  --provider <name>    openai, deepseek, qwen, doubao, moonshot, gemini, anthropic, ollama, mock.
  --model <name>       Override model.
  --base-url <url>     Override provider base URL.
  --api-key <key>      Override provider API key.
  --temperature <num>  Defaults to 0.4.
  --json               Print full JSON result.
`);
}
