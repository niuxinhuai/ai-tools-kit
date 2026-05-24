# Workflows

Workflows run multiple tools in sequence. The output of each step becomes the input of the next step.

## Run a Workflow

```bash
ai-tools --workflow workflows/content-pipeline.json --file notes.md
```

Write a Markdown report:

```bash
ai-tools --workflow workflows/content-pipeline.json --file notes.md --out workflow-results
```

## Schema

```json
{
  "name": "Content Pipeline",
  "language": "zh",
  "provider": "mock",
  "fallbackProviders": "openai,ollama",
  "steps": [
    {
      "name": "Summarize source material",
      "toolId": "summarize",
      "option": "structured"
    },
    {
      "name": "Create social post",
      "toolId": "social-post",
      "option": "twitter"
    }
  ]
}
```

## Long Inputs

For long files, use chunking:

```bash
ai-tools --tool summarize --file long.md --chunk-size 8000
```

For many files, merge them into one input:

```bash
ai-tools --tool summarize --files "docs/*.md" --merge-files --chunk-size 8000
```
