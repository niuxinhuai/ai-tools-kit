# 自定义工具

你可以不改源码，直接新增自己的 AI 工具。

## 创建自定义工具文件

```bash
mkdir -p tools
cp tools/custom.example.json tools/custom.json
```

`tools/custom.json` 已加入 `.gitignore`，适合保存本地私有 Prompt。

## 配置格式

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

支持的模板变量：

- `{{input}}`：用户输入。
- `{{option}}`：当前选择的工具模式。
- `{{language}}`：当前输出语言。
- 自定义变量，例如 `{{audience}}`、`{{goal}}`。

自定义变量可以通过 `variables` 声明。网页端会自动渲染对应表单，CLI 支持重复传入 `--var key=value`：

```bash
ai-tools --tool email-reply --input "感谢更新" --var audience=customer --var goal="确认下一步"
```

变量字段支持：

- `name`：必填。支持字母、数字、`_`、`-`，且必须以字母或 `_` 开头。
- `label`：双语标签或普通字符串。
- `placeholder`：双语占位文案或普通字符串。
- `default`：可选默认值。
- `required`：设为 `true` 时不允许空值。
- `type`：`text`、`textarea` 或 `select`。
- `options`：`type` 为 `select` 时必填。

如果 Prompt 中使用了未声明的自定义占位符，AI Tools Kit 会自动推断成普通文本输入框。

## 自定义文件位置

```bash
AI_TOOLS_CUSTOM_FILE=/absolute/path/my-tools.json npm start
```

CLI 也会读取同一个变量。

## 模板库

可复用模板位于 `tools/templates/`。

示例：

- `tools/templates/product-and-content.json`：PRD 摘要、竞品分析、短视频脚本。
- `tools/templates/developer-tools.json`：SQL 解释、提交信息、Bug 报告。

使用模板：

```bash
cp tools/templates/developer-tools.json tools/custom.json
npm start
```

也可以直接指定模板文件：

```bash
AI_TOOLS_CUSTOM_FILE=tools/templates/product-and-content.json npm start
```
