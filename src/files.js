import fs from "node:fs/promises";
import path from "node:path";

export async function expandFilePatterns(patterns) {
  const expanded = [];
  for (const pattern of patterns) {
    const matches = hasWildcard(pattern)
      ? await matchPattern(pattern)
      : [path.resolve(pattern)];
    expanded.push(...matches);
  }
  return [...new Set(expanded)].sort();
}

export function outputFileName(inputFile, extension) {
  const parsed = path.parse(inputFile);
  return `${parsed.name}.${extension}`;
}

export function formatResult(result, format = "md") {
  if (format === "json") {
    return `${JSON.stringify(result, null, 2)}\n`;
  }
  if (format === "jsonl") {
    return `${JSON.stringify(result)}\n`;
  }
  if (format === "txt") {
    return `${result.output}\n`;
  }
  return [
    `# ${result.toolId}`,
    "",
    `- Provider: ${result.provider.name}`,
    `- Model: ${result.provider.model}`,
    `- Option: ${result.option}`,
    `- Language: ${result.language}`,
    "",
    result.output,
    ""
  ].join("\n");
}

async function matchPattern(pattern) {
  const absolutePattern = path.resolve(pattern);
  const root = patternRoot(absolutePattern);
  const regex = globToRegExp(absolutePattern);
  const files = await walkFiles(root);
  return files.filter((file) => regex.test(file));
}

async function walkFiles(root) {
  const files = [];
  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function patternRoot(pattern) {
  const parts = pattern.split(path.sep);
  const wildcardIndex = parts.findIndex((part) => hasWildcard(part));
  if (wildcardIndex === -1) {
    return path.dirname(pattern);
  }
  const rootParts = parts.slice(0, wildcardIndex);
  return rootParts.length ? rootParts.join(path.sep) || path.sep : process.cwd();
}

function globToRegExp(pattern) {
  const normalized = pattern.split(path.sep).join("/");
  let source = "";
  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];
    if (char === "*" && next === "*") {
      source += ".*";
      index += 1;
    } else if (char === "*") {
      source += "[^/]*";
    } else if (char === "?") {
      source += "[^/]";
    } else {
      source += escapeRegExp(char);
    }
  }
  return new RegExp(`^${source}$`);
}

function hasWildcard(value) {
  return /[*?]/.test(value);
}

function escapeRegExp(char) {
  return char.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
}
