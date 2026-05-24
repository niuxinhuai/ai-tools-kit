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
      "variables": [
        {
          "name": "audience",
          "label": { "zh": "收件人", "en": "Audience" },
          "placeholder": { "zh": "例如：客户", "en": "Example: customer" },
          "default": "customer",
          "required": true
        },
        {
          "name": "goal",
          "label": { "zh": "回复目标", "en": "Reply goal" },
          "type": "textarea"
        }
      ],
      "promptTemplate": "Write an email reply in a {{option}} tone for {{audience}}.\nReply goal: {{goal}}\n\nMaterial:\n{{input}}"
    }
  ]
}
```

Supported template variables:

- `{{input}}`: user input.
- `{{option}}`: selected tool option.
- `{{language}}`: selected output language.
- Custom variables such as `{{audience}}` or `{{goal}}`.

Custom variables can be declared with `variables`. The web app automatically renders fields for them, and the CLI accepts repeated `--var key=value` flags:

```bash
ai-tools --tool email-reply --input "Thanks for the update" --var audience=customer --var goal="confirm next step"
```

Variable fields support:

- `name`: required. Use letters, numbers, `_`, or `-`; it must start with a letter or `_`.
- `label`: bilingual label or plain string.
- `placeholder`: bilingual placeholder or plain string.
- `default`: optional default value.
- `required`: set to `true` to block empty values.
- `type`: `text`, `textarea`, or `select`.
- `options`: required when `type` is `select`.

If a prompt uses a custom placeholder that is not declared in `variables`, AI Tools Kit will infer a simple text field automatically.

## Custom Location

```bash
AI_TOOLS_CUSTOM_FILE=/absolute/path/my-tools.json npm start
```

The CLI uses the same variable.

## Template Library

Reusable templates live in `tools/templates/`.

Examples:

- `tools/templates/product-and-content.json`: PRD summaries, competitor analysis, short video scripts.
- `tools/templates/developer-tools.json`: SQL explanation, commit messages, bug reports.

To use a template:

```bash
cp tools/templates/developer-tools.json tools/custom.json
npm start
```

You can also point to a template directly:

```bash
AI_TOOLS_CUSTOM_FILE=tools/templates/product-and-content.json npm start
```
