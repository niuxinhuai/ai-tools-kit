# Project Config

AI Tools Kit can read project-level CLI defaults from the nearest `.ai-tools-kit.json`, searching upward from the current directory.

## Create Config

```bash
ai-tools --init-config
```

This creates:

```json
{
  "tool": "summarize",
  "option": "structured",
  "language": "zh",
  "provider": "mock",
  "model": "",
  "temperature": 0.4,
  "fallbackProviders": "",
  "variables": {
    "audience": "developers"
  },
  "retries": 0,
  "cache": false
}
```

## Usage

```bash
ai-tools --input "Meeting notes..." --print-prompt
ai-tools --file notes.md
ai-tools --tool rewrite --input "Override the configured tool"
```

CLI flags always override config values.

## Custom Path

```bash
ai-tools --config ./team.ai-tools.json --input "hello"
ai-tools --no-config --tool rewrite --input "ignore local config"
```

## Supported Fields

Project config can define defaults for:

- `tool`, `option`, `language`
- `provider`, `model`, `baseUrl`, `apiKey`
- `temperature`, `fallbackProviders`
- `variables`
- `cache`, `noCache`, `cacheFile`
- `format`, `out`
- `retries`, `chunkSize`, `chunkOverlap`, `mergeFiles`, `failFast`

Do not commit real API keys in config files. Prefer `.env` or shell environment variables for secrets.
