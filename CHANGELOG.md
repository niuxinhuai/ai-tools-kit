# Changelog

## 2026-05-24

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
