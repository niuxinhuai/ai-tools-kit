# AI Tools Kit

A bilingual AI toolbox for daily writing, coding, summarizing, translation, workflows, and local automation. It runs as both a web app and a CLI, with pluggable providers and no runtime dependencies.

中文文档见 [README.zh-CN.md](./README.zh-CN.md).

## 3-Minute Start

```bash
git clone https://github.com/niuxinhuai/ai-tools-kit.git
cd ai-tools-kit
cp .env.example .env
npm start
```

Open <http://localhost:5177>. Use `AI_PROVIDER=mock` when you want to try everything without an API key.

## Common Commands

```bash
npm run cli -- --list
npm run cli -- --tool rewrite --input "Make this sentence better." --lang en --provider mock
npm run cli -- --tool summarize --files "docs/*.md" --out summaries --format md
npm run cli -- --tool email-reply --input "Thanks" --var audience=customer --var goal="confirm next step"
npm run cli -- --workflow workflows/content-pipeline.json --file notes.md --provider mock
npm run cli -- --doctor --provider deepseek
npm run cli -- --init --yes --with-api-token
AI_TOOLS_CACHE=1 ai-tools --tool summarize --file notes.md
```

## Core Capabilities

- Web app and CLI in one zero-dependency Node project.
- Built-in tools for rewriting, summarizing, prompt building, code explanation, reports, translation, social posts, and ideation.
- Provider support for OpenAI, OpenAI-compatible APIs, DeepSeek, Qwen, Doubao, Moonshot, Gemini, Anthropic, Ollama, and mock mode.
- Streaming web output, file import, result export, prompt preview, and enhanced local history.
- Batch CLI, merged multi-file input, long-input chunking, local cache, workflows, and provider fallback.
- Custom tools through `tools/custom.json`, with reusable templates in `tools/templates/`.
- Prompt variables for custom tools, with auto-generated web forms and CLI `--var` support.
- Local HTTP API, OpenAPI spec, optional API token protection, Docker support, and npm publishing metadata.

## Built-In Tools

| ID | Tool |
| --- | --- |
| `rewrite` | Copy Rewriter |
| `summarize` | File Summarizer |
| `prompt` | Prompt Builder |
| `code-explain` | Code Explainer |
| `weekly-report` | Weekly Report |
| `translate` | Bilingual Translator |
| `social-post` | Social Post Maker |
| `idea-lab` | Idea Lab |

## Configuration

Copy `.env.example` and choose a provider:

```bash
AI_PROVIDER=openai-compatible
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your_key
AI_MODEL=gpt-4o-mini
```

Ollama example:

```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
AI_MODEL=llama3.1
```

## Advanced Docs

- Providers: [docs/PROVIDERS.md](./docs/PROVIDERS.md)
- Custom tools: [docs/CUSTOM_TOOLS.md](./docs/CUSTOM_TOOLS.md)
- Workflows: [docs/WORKFLOWS.md](./docs/WORKFLOWS.md)
- API: [docs/API.md](./docs/API.md)
- OpenAPI: [openapi.json](./openapi.json)
- Deployment: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- Security: [docs/SECURITY.md](./docs/SECURITY.md)
- Changelog: [CHANGELOG.md](./CHANGELOG.md)

## Scripts

```bash
npm start          # run web app and API server
npm run cli        # run CLI
npm run check      # syntax checks
npm test           # smoke + CLI + API + package tests
npm run test:api   # API endpoint tests
```

## License

MIT
