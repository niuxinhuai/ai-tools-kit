# Provider Guide

AI Tools Kit uses one shared provider layer for the web app and CLI.

## Supported Providers

| Provider | `AI_PROVIDER` | Notes |
| --- | --- | --- |
| Mock | `mock` | Local demo, no network or key required. |
| OpenAI | `openai` | Uses `OPENAI_API_KEY` and OpenAI chat completions. |
| OpenAI-compatible | `openai-compatible` | Set `OPENAI_BASE_URL`, `OPENAI_API_KEY`, and `AI_MODEL`. |
| DeepSeek | `deepseek` | OpenAI-compatible endpoint. |
| Qwen / DashScope | `qwen` | OpenAI-compatible DashScope endpoint. |
| Doubao / Volcano Ark | `doubao` | Set `DOUBAO_BASE_URL`, because account endpoints can vary. |
| Moonshot | `moonshot` | OpenAI-compatible endpoint. |
| Gemini | `gemini` | Uses Google Gemini `generateContent`. |
| Anthropic | `anthropic` | Uses Anthropic Messages API. |
| Ollama | `ollama` | Local model server, no cloud key required. |

## Quick Setup

Copy the example env file:

```bash
cp .env.example .env
```

Then choose one provider:

```bash
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_key
AI_MODEL=deepseek-chat
```

For custom OpenAI-compatible providers:

```bash
AI_PROVIDER=openai-compatible
OPENAI_BASE_URL=https://your-provider.example.com/v1
OPENAI_API_KEY=your_key
AI_MODEL=your-model
```

For Ollama:

```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
AI_MODEL=llama3.1
```

## Adding a Provider

Add a default entry in `src/providers.js`, then implement a request function when the provider is not OpenAI-compatible. The rest of the app and CLI will pick it up automatically.

## Fallback Providers

Use fallback providers when you want a backup model if the primary provider fails:

```bash
AI_PROVIDER=deepseek
AI_FALLBACK_PROVIDERS=openai,ollama
```

CLI override:

```bash
ai-tools --tool rewrite --input "hello" --provider deepseek --fallback-providers mock
```
