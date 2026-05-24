# 项目级配置

AI Tools Kit 可以从最近的 `.ai-tools-kit.json` 读取 CLI 默认配置。查找会从当前目录开始，逐级向上查找。

## 创建配置

```bash
ai-tools --init-config
```

会生成：

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
  "cache": false
}
```

## 使用方式

```bash
ai-tools --input "会议记录..." --print-prompt
ai-tools --file notes.md
ai-tools --tool rewrite --input "临时覆盖配置里的工具"
```

命令行显式参数永远优先于配置文件。

## 自定义路径

```bash
ai-tools --config ./team.ai-tools.json --input "hello"
ai-tools --no-config --tool rewrite --input "忽略本地配置"
```

## 支持字段

项目配置可以设置这些默认值：

- `tool`、`option`、`language`
- `provider`、`model`、`baseUrl`、`apiKey`
- `temperature`、`fallbackProviders`
- `variables`
- `cache`、`noCache`、`cacheFile`
- `format`、`out`
- `chunkSize`、`chunkOverlap`、`mergeFiles`、`failFast`

不要把真实 API Key 提交到配置文件里。密钥更适合放在 `.env` 或 shell 环境变量中。
