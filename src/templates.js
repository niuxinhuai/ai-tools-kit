import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatesDir = path.join(rootDir, "tools/templates");

export async function listTemplates() {
  const entries = await fs.readdir(templatesDir, { withFileTypes: true });
  const templates = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }
    const filePath = path.join(templatesDir, entry.name);
    const template = await readToolsFile(filePath);
    templates.push({
      name: path.basename(entry.name, ".json"),
      filePath,
      count: template.tools.length,
      tools: template.tools.map((tool) => tool.id)
    });
  }
  return templates.sort((left, right) => left.name.localeCompare(right.name));
}

export async function installTemplate(name, { targetPath, merge = false, force = false } = {}) {
  const sourcePath = await resolveTemplatePath(name);
  const source = await readToolsFile(sourcePath);
  const target = path.resolve(targetPath);
  let output;

  if (merge) {
    const existing = await readOptionalToolsFile(target);
    output = mergeTools(existing, source, { force });
  } else {
    if (!force && await fileExists(target)) {
      throw new Error(`${target} already exists. Use --merge-template to merge or --force to overwrite.`);
    }
    output = source;
  }

  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  return {
    sourcePath,
    targetPath: target,
    count: output.tools.length,
    installed: source.tools.length,
    merged: merge
  };
}

async function resolveTemplatePath(name) {
  if (!name || name === true) {
    throw new Error("Provide a template name, such as --install-template developer-tools.");
  }
  const directPath = path.resolve(String(name));
  if (await fileExists(directPath)) {
    return directPath;
  }
  const templatePath = path.join(templatesDir, `${name}.json`);
  if (await fileExists(templatePath)) {
    return templatePath;
  }
  throw new Error(`Unknown template "${name}". Run --templates to list available templates.`);
}

async function readOptionalToolsFile(filePath) {
  if (!await fileExists(filePath)) {
    return { tools: [] };
  }
  return readToolsFile(filePath);
}

async function readToolsFile(filePath) {
  const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
  const tools = Array.isArray(parsed) ? parsed : parsed.tools;
  if (!Array.isArray(tools)) {
    throw new Error(`${filePath} must contain an array or {"tools": []}.`);
  }
  return { tools };
}

function mergeTools(existing, source, { force }) {
  const byId = new Map(existing.tools.map((tool) => [String(tool.id), tool]));
  for (const tool of source.tools) {
    const id = String(tool.id);
    if (byId.has(id) && !force) {
      throw new Error(`Tool id "${id}" already exists. Use --force to replace duplicates.`);
    }
    byId.set(id, tool);
  }
  return { tools: [...byId.values()] };
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
