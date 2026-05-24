# AI Tools Kit

A practical bilingual AI toolbox that works as both a web app and a CLI. It is designed for small daily AI tasks: rewriting, summarizing, prompt building, code explanation, translation, social posts, weekly reports, and idea generation.

中文文档见 [README.zh-CN.md](./README.zh-CN.md).

## Features

- Web app and CLI in one zero-dependency Node project.
- Chinese, English, and bilingual output modes.
- Shared tool definitions for web and CLI.
- Provider support for OpenAI, OpenAI-compatible APIs, DeepSeek, Qwen, Doubao, Moonshot, Gemini, Anthropic, Ollama, and local mock mode.
- No build step required.

## Quick Start

```bash
git clone https://github.com/niuxinhuai/ai-tools-kit.git
cd ai-tools-kit
cp .env.example .env
npm start
```

Open <http://localhost:5177>.

The default sample config can run in `mock` mode if you set:

```bash
AI_PROVIDER=mock
```

## CLI Usage

```bash
npm run cli -- --list
npm run cli -- --tool rewrite --input "Make this sentence better." --lang en --provider mock
cat notes.md | npm run cli -- --tool summarize --option structured --lang zh
```

If installed globally or linked locally:

```bash
npm link
ai-tools --tool code-explain --file ./snippet.js --lang bilingual
```

## Built-in Tools

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

## Provider Setup

See [docs/PROVIDERS.md](./docs/PROVIDERS.md).

Basic OpenAI-compatible setup:

```bash
AI_PROVIDER=openai-compatible
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your_key
AI_MODEL=gpt-4o-mini
```

Ollama local setup:

```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
AI_MODEL=llama3.1
```

## Project Structure

```text
ai-tools-kit/
  bin/              CLI entry
  docs/             Provider docs
  public/           Web app
  server/           Static server and API endpoint
  src/              Shared tools, provider adapters, runtime
  tests/            Smoke tests
```

## Scripts

```bash
npm start       # run web app and API server
npm run cli     # run CLI
npm test        # mock-mode smoke test
npm run check   # syntax checks
```

## License

MIT
