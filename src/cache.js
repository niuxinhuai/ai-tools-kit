import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export function shouldUseCache(options = {}) {
  if (options.noCache) {
    return false;
  }
  return Boolean(options.cache || process.env.AI_TOOLS_CACHE === "1");
}

export function cacheKey(payload) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

export function defaultCachePath() {
  return process.env.AI_TOOLS_CACHE_FILE || path.join(os.homedir(), ".ai-tools-kit", "cache.json");
}

export async function readCache(filePath = defaultCachePath()) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return {};
  }
}

export async function writeCache(cache, filePath = defaultCachePath()) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(cache, null, 2), "utf8");
}

export async function clearCache(filePath = defaultCachePath()) {
  await writeCache({}, filePath);
}
