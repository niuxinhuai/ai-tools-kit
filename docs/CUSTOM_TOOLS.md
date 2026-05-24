# Custom Tools

You can add local tools without changing source code.

## Create a Custom Tool File

```bash
mkdir -p tools
cp tools/custom.example.json tools/custom.json
```

`tools/custom.json` is ignored by Git so you can keep private prompts locally.

## Schema

```json
{
  "tools": [
    {
      "id": "email-reply",
      "icon": "pen",
      "category": "Custom",
      "title": {
        "zh": "邮件回复助手",
        "en": "Email Reply Assistant"
      },
      "description": {
        "zh": "根据原邮件和你的要点生成回复。",
        "en": "Draft a reply from the original email and your notes."
      },
      "inputLabel": {
        "zh": "原邮件和回复要点",
        "en": "Original email and reply notes"
      },
      "placeholder": {
        "zh": "粘贴原邮件...",
        "en": "Paste the original email..."
      },
      "options": [
        { "value": "friendly", "zh": "友好", "en": "Friendly" }
      ],
      "promptTemplate": "Write an email reply in a {{option}} tone.\n\nMaterial:\n{{input}}"
    }
  ]
}
```

Supported template variables:

- `{{input}}`: user input.
- `{{option}}`: selected tool option.

## Custom Location

```bash
AI_TOOLS_CUSTOM_FILE=/absolute/path/my-tools.json npm start
```

The CLI uses the same variable.
