# API Reference

AI Tools Kit exposes a small local HTTP API from the same Node server that serves the web app.

OpenAPI spec: [`openapi.json`](../openapi.json). When the server is running, it is also available at:

```text
http://localhost:5177/openapi.json
```

## Authentication

If `AI_TOOLS_API_TOKEN` is set, protected API calls require:

```text
Authorization: Bearer <AI_TOOLS_API_TOKEN>
```

`GET /api/health` and `GET /api/meta` stay public so clients can discover server state and configuration requirements.

## `GET /api/health`

Returns runtime health, provider diagnostics, custom tool validation, and a security note.

```bash
curl http://localhost:5177/api/health
```

The response does not include API keys.

## `GET /api/meta`

Returns tool definitions, supported languages, providers, and active provider status.

```bash
curl http://localhost:5177/api/meta
```

## `POST /api/prompt`

Builds the final prompt for a tool without calling an AI provider.

```bash
curl -s http://localhost:5177/api/prompt \
  -H 'Content-Type: application/json' \
  -d '{"toolId":"rewrite","input":"hello","option":"polish","language":"en"}'
```

## `POST /api/run`

Runs a tool and returns the full result after the provider completes.

```bash
curl -s http://localhost:5177/api/run \
  -H 'Content-Type: application/json' \
  -d '{"toolId":"summarize","input":"Long text","language":"en","provider":{"provider":"mock"}}'
```

## `POST /api/run-stream`

Runs a tool and returns Server-Sent Events.

```bash
curl -N http://localhost:5177/api/run-stream \
  -H 'Content-Type: application/json' \
  -d '{"toolId":"rewrite","input":"hello","language":"en","provider":{"provider":"mock"}}'
```

Event types:

- `meta`: tool, language, option, provider, and model.
- `chunk`: generated text chunk.
- `done`: stream completed.
- `error`: stream failed.

## Request Fields

| Field | Type | Notes |
| --- | --- | --- |
| `toolId` | string | Tool id from `/api/meta`. |
| `input` | string | User input. |
| `option` | string | Optional tool mode. Defaults to the first mode. |
| `language` | string | `zh`, `en`, or `bilingual`. |
| `provider.provider` | string | Provider name, such as `openai`, `deepseek`, `ollama`, or `mock`. |
| `provider.model` | string | Optional model override. |
| `provider.baseUrl` | string | Optional base URL override. |
| `provider.apiKey` | string | Optional API key override. Prefer server env vars for real use. |
| `temperature` | number | Optional, defaults to `0.4`. |
