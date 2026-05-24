# 工作流

工作流会按顺序运行多个工具，每一步的输出会成为下一步的输入。

## 运行工作流

```bash
ai-tools --workflow workflows/content-pipeline.json --file notes.md
```

输出 Markdown 报告：

```bash
ai-tools --workflow workflows/content-pipeline.json --file notes.md --out workflow-results
```

## 配置格式

```json
{
  "name": "Content Pipeline",
  "language": "zh",
  "provider": "mock",
  "fallbackProviders": "openai,ollama",
  "variables": {
    "audience": "developers"
  },
  "steps": [
    {
      "name": "Summarize source material",
      "toolId": "summarize",
      "option": "structured"
    },
    {
      "name": "Create social post",
      "toolId": "social-post",
      "option": "twitter",
      "variables": {
        "tone": "practical"
      }
    }
  ]
}
```

顶层 `variables` 会传给每一步；步骤里的 `variables` 会覆盖当前步骤的同名变量。

## 长文本

处理长文件时可以启用分块：

```bash
ai-tools --tool summarize --file long.md --chunk-size 8000
```

处理多个文件时可以先合并为一个输入：

```bash
ai-tools --tool summarize --files "docs/*.md" --merge-files --chunk-size 8000
```
