import fs from "node:fs/promises";
import path from "node:path";

export const projectConfigFileName = ".ai-tools-kit.json";

export async function findProjectConfig(startDir = process.cwd()) {
  let current = path.resolve(startDir);
  while (true) {
    const candidate = path.join(current, projectConfigFileName);
    if (await fileExists(candidate)) {
      return candidate;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}

export async function loadProjectConfig({ configPath, cwd = process.cwd(), disabled = false } = {}) {
  if (disabled) {
    return { path: undefined, config: {} };
  }

  const resolvedPath = configPath
    ? path.resolve(cwd, configPath)
    : await findProjectConfig(cwd);
  if (!resolvedPath) {
    return { path: undefined, config: {} };
  }

  const raw = await fs.readFile(resolvedPath, "utf8");
  const parsed = JSON.parse(raw);
  return {
    path: resolvedPath,
    config: normalizeProjectConfig(parsed)
  };
}

export function mergeProjectConfig(args = {}, config = {}) {
  const merged = { ...args };
  const defaults = config.defaults && typeof config.defaults === "object"
    ? { ...config.defaults, ...config }
    : config;
  delete defaults.defaults;

  for (const key of configKeys()) {
    if (merged[key] === undefined && defaults[key] !== undefined) {
      merged[key] = defaults[key];
    }
  }

  if (merged.lang === undefined && merged.language === undefined && defaults.language !== undefined) {
    merged.language = defaults.language;
  }

  merged.configVariables = {
    ...(isObject(defaults.variables) ? defaults.variables : {}),
    ...(isObject(args.configVariables) ? args.configVariables : {})
  };

  return merged;
}

export async function writeProjectConfig(filePath, config = sampleProjectConfig(), { force = false } = {}) {
  const target = path.resolve(filePath);
  if (!force && await fileExists(target)) {
    throw new Error(`${target} already exists. Use --force to overwrite.`);
  }
  await fs.writeFile(target, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return target;
}

export function sampleProjectConfig() {
  return {
    tool: "summarize",
    option: "structured",
    language: "zh",
    provider: "mock",
    model: "",
    temperature: 0.4,
    fallbackProviders: "",
    variables: {
      audience: "developers"
    },
    cache: false
  };
}

function normalizeProjectConfig(config) {
  if (!isObject(config)) {
    throw new Error(`${projectConfigFileName} must contain a JSON object.`);
  }
  return config;
}

function configKeys() {
  return [
    "tool",
    "option",
    "language",
    "provider",
    "model",
    "baseUrl",
    "apiKey",
    "temperature",
    "fallbackProviders",
    "cache",
    "noCache",
    "cacheFile",
    "format",
    "out",
    "chunkSize",
    "chunkOverlap",
    "mergeFiles",
    "failFast"
  ];
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
