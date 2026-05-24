# API 文档

AI Tools Kit 的 Node 服务同时提供网页和本地 HTTP API。

## `GET /api/health`

返回运行状态、Provider 诊断、自定义工具校验结果和安全说明。

```bash
curl http://localhost:5177/api/health
```

响应不会包含 API Key。

## `GET /api/meta`

返回工具定义、语言、Provider 列表和当前 Provider 状态。

```bash
curl http://localhost:5177/api/meta
```

## `POST /api/prompt`

生成某个工具最终会发给模型的 Prompt，但不会调用模型。

```bash
curl -s http://localhost:5177/api/prompt \
  -H 'Content-Type: application/json' \
  -d '{"toolId":"rewrite","input":"hello","option":"polish","language":"en"}'
```

## `POST /api/run`

运行工具，等待 Provider 完成后一次性返回结果。

```bash
curl -s http://localhost:5177/api/run \
  -H 'Content-Type: application/json' \
  -d '{"toolId":"summarize","input":"Long text","language":"en","provider":{"provider":"mock"}}'
```

## `POST /api/run-stream`

运行工具并返回 Server-Sent Events 流式响应。

```bash
curl -N http://localhost:5177/api/run-stream \
  -H 'Content-Type: application/json' \
  -d '{"toolId":"rewrite","input":"hello","language":"en","provider":{"provider":"mock"}}'
```

事件类型：

- `meta`：工具、语言、模式、Provider 和模型信息。
- `chunk`：生成文本片段。
- `done`：流式完成。
- `error`：流式失败。

## 请求字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `toolId` | string | 来自 `/api/meta` 的工具 ID。 |
| `input` | string | 用户输入。 |
| `option` | string | 可选工具模式，默认第一个模式。 |
| `language` | string | `zh`、`en` 或 `bilingual`。 |
| `provider.provider` | string | Provider 名称，如 `openai`、`deepseek`、`ollama`、`mock`。 |
| `provider.model` | string | 可选模型覆盖。 |
| `provider.baseUrl` | string | 可选 Base URL 覆盖。 |
| `provider.apiKey` | string | 可选 API Key 覆盖，真实使用更推荐服务端环境变量。 |
| `temperature` | number | 可选，默认 `0.4`。 |
