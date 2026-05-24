# Provider 配置指南

AI Tools Kit 的网页端和 CLI 共用同一套 Provider 层。

## 已支持 Provider

| Provider | `AI_PROVIDER` | 说明 |
| --- | --- | --- |
| Mock | `mock` | 本地演示模式，不需要网络和密钥。 |
| OpenAI | `openai` | 使用 `OPENAI_API_KEY` 和 Chat Completions。 |
| OpenAI-compatible | `openai-compatible` | 设置 `OPENAI_BASE_URL`、`OPENAI_API_KEY`、`AI_MODEL`。 |
| DeepSeek | `deepseek` | OpenAI 兼容接口。 |
| 通义千问 / DashScope | `qwen` | DashScope OpenAI 兼容接口。 |
| 豆包 / 火山 Ark | `doubao` | 需要设置 `DOUBAO_BASE_URL`，不同账号/地域可能不同。 |
| Moonshot | `moonshot` | OpenAI 兼容接口。 |
| Gemini | `gemini` | 使用 Google Gemini `generateContent`。 |
| Anthropic | `anthropic` | 使用 Anthropic Messages API。 |
| Ollama | `ollama` | 本地模型服务，不需要云端密钥。 |

## 快速配置

复制示例配置：

```bash
cp .env.example .env
```

选择一个 Provider：

```bash
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_key
AI_MODEL=deepseek-chat
```

自定义 OpenAI 兼容服务：

```bash
AI_PROVIDER=openai-compatible
OPENAI_BASE_URL=https://your-provider.example.com/v1
OPENAI_API_KEY=your_key
AI_MODEL=your-model
```

Ollama 本地模型：

```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
AI_MODEL=llama3.1
```

## 新增 Provider

在 `src/providers.js` 中增加默认配置。如果新 Provider 不是 OpenAI 兼容接口，再补一个请求函数即可；网页端和 CLI 会自动复用。

## Fallback Provider

如果主 Provider 失败，可以设置备用 Provider：

```bash
AI_PROVIDER=deepseek
AI_FALLBACK_PROVIDERS=openai,ollama
```

CLI 覆盖：

```bash
ai-tools --tool rewrite --input "hello" --provider deepseek --fallback-providers mock
```
