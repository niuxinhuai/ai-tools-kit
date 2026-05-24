import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

const { stdout, stderr } = await exec("npm", ["--cache", "/tmp/npm-cache-ai-tools-ci", "pack", "--dry-run"], {
  cwd: process.cwd()
});
const output = `${stdout}\n${stderr}`;

assert.match(output, /ai-tools-kit-0\.1\.0\.tgz/);
assert.match(output, /openapi\.json/);
assert.match(output, /workflows\/content-pipeline\.json/);

console.log("Package tests passed.");
