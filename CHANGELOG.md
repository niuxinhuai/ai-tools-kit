# Changelog

## 2026-05-24

### feat: Add prompt debug mode

- Added shared prompt debug metadata with system instructions, templates, variables, rendered tool prompt, and final prompt.
- Added CLI `--debug-prompt`, API `/api/prompt-debug`, and a web Debug button.
- Updated OpenAPI, API docs, README examples, and tests.

### feat: Add custom tool template installer

- Added `--templates` to list reusable custom tool templates.
- Added `--install-template`, `--merge-template`, and `--force` for installing or merging template packs.
- Updated custom tool docs, README examples, syntax checks, and CLI tests.

### feat: Add batch retries and JSONL output

- Added `--retries` for failed batch items.
- Added `--format jsonl` for script-friendly batch output.
- Updated config support, README examples, and CLI tests.

### feat: Add project-level CLI config

- Added `.ai-tools-kit.json` discovery, `--config`, `--no-config`, and `--init-config`.
- Project config can define default tool, provider, language, variables, cache, and batch options.
- Added bilingual config docs and CLI tests for config lookup and overrides.

### feat: Add prompt variables for custom tools

- Added custom tool `variables` metadata and template replacement for placeholders such as `{{audience}}`.
- Added CLI `--var key=value` support and web auto-generated variable fields.
- Updated custom tool examples, docs, OpenAPI schema, and tests.

### test: Strengthen CI and README

- Added dedicated CLI, API, and package dry-run tests.
- Updated CI to run smoke, CLI, API, and package checks separately.
- Reworked README files around quick start, common commands, core capabilities, and advanced docs.

### feat: Add workflows, fallback, and long-input handling

- Added linear workflow execution through `--workflow`.
- Added provider fallback through `--fallback-providers` and `AI_FALLBACK_PROVIDERS`.
- Added merged multi-file input with `--merge-files`.
- Added long-input chunking with `--chunk-size` and synthesis.

### feat: Add cache, history controls, templates, and OpenAPI

- Added opt-in CLI cache with `--cache`, `--cache-file`, and `--clear-cache`.
- Enhanced web history with search, tool filtering, item copy, export, delete, and rerun.
- Added reusable custom tool templates under `tools/templates/`.
- Added `openapi.json` and served it at `/openapi.json`.

### feat: Prepare publishing and self-hosted protection

- Added optional `AI_TOOLS_API_TOKEN` protection for provider-calling endpoints.
- Added web API token input for protected deployments.
- Added `ai-tools --init` to create `.env` files.
- Added `ai-tools --test-provider` for provider connectivity checks.
- Added npm publish metadata and package file whitelist.
- Added GitHub issue and pull request templates.

### feat: Improve toolbox maturity

- Added `/api/health` for runtime, provider, custom tool, and security diagnostics.
- Added `/api/prompt` and web/CLI prompt preview.
- Added `ai-tools --validate-tools` for custom tool validation.
- Improved batch CLI mode with success/failure summary and `--fail-fast`.
- Added API and security documentation.

### feat: Improve extensibility

- Added provider diagnostics.
- Added web result export for Markdown, TXT, and JSON.
- Added batch CLI processing for multiple files.
- Added custom tools through `tools/custom.json`.

### feat: Improve web generation experience

- Added streaming output for OpenAI-compatible providers and Ollama.
- Added text file import.
- Added local browser history.
- Added Docker and deployment documentation.

### feat: Initial release

- Added bilingual web app and CLI.
- Added built-in AI tools for rewriting, summarizing, prompt building, code explanation, reports, translation, social posts, and ideation.
- Added provider support for OpenAI-compatible APIs, DeepSeek, Qwen, Doubao, Moonshot, Gemini, Anthropic, Ollama, and mock mode.
