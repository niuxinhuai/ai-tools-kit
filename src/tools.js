import fs from "node:fs";
import path from "node:path";

export const languages = {
  zh: {
    label: "中文",
    instruction: "请用自然、清晰、适合中文用户的中文回答。"
  },
  en: {
    label: "English",
    instruction: "Answer in clear, natural English."
  },
  bilingual: {
    label: "中英双语",
    instruction: "Answer bilingually. Put Chinese first, then English. Keep both versions concise and aligned."
  }
};

const builtInTools = [
  {
    id: "rewrite",
    icon: "pen",
    category: "Writing",
    title: { zh: "文案改写器", en: "Copy Rewriter" },
    description: {
      zh: "润色、扩写、缩写、去 AI 味，适合运营文案、公告和邮件。",
      en: "Polish, expand, shorten, or humanize copy for posts, notices, and email."
    },
    inputLabel: { zh: "原始文案", en: "Original copy" },
    placeholder: {
      zh: "粘贴一段要润色或改写的文字...",
      en: "Paste the copy you want to polish or rewrite..."
    },
    options: [
      { value: "polish", zh: "自然润色", en: "Polish" },
      { value: "humanize", zh: "去 AI 味", en: "Humanize" },
      { value: "shorten", zh: "压缩变短", en: "Shorten" },
      { value: "expand", zh: "扩写增强", en: "Expand" }
    ],
    buildPrompt: ({ input, option }) => `Rewrite the following content with mode "${option}". Preserve facts and intent, improve clarity, remove filler, and return only the rewritten result.\n\nContent:\n${input}`
  },
  {
    id: "summarize",
    icon: "sparkles",
    category: "Reading",
    title: { zh: "文件总结器", en: "File Summarizer" },
    description: {
      zh: "把长文、会议记录、Markdown 或 TXT 整理成摘要、要点和行动项。",
      en: "Turn long text, notes, Markdown, or TXT into summaries, key points, and actions."
    },
    inputLabel: { zh: "要总结的内容", en: "Content to summarize" },
    placeholder: {
      zh: "粘贴文章、会议记录、PRD 或日志...",
      en: "Paste an article, meeting note, PRD, or log..."
    },
    options: [
      { value: "brief", zh: "简短摘要", en: "Brief" },
      { value: "structured", zh: "结构化要点", en: "Structured" },
      { value: "actions", zh: "行动项", en: "Action items" }
    ],
    buildPrompt: ({ input, option }) => `Summarize the content with mode "${option}". Include the core idea, important details, risks or open questions when useful, and action items if the mode asks for them.\n\nContent:\n${input}`
  },
  {
    id: "prompt",
    icon: "wand",
    category: "Prompting",
    title: { zh: "Prompt 生成器", en: "Prompt Builder" },
    description: {
      zh: "根据目标生成高质量提示词，包含角色、上下文、约束和输出格式。",
      en: "Generate strong prompts with role, context, constraints, and output format."
    },
    inputLabel: { zh: "你想让 AI 做什么", en: "What should the AI do?" },
    placeholder: {
      zh: "例如：帮我分析竞品 App 的会员页，并输出优化建议...",
      en: "Example: analyze a competitor membership page and suggest improvements..."
    },
    options: [
      { value: "general", zh: "通用任务", en: "General" },
      { value: "coding", zh: "编程任务", en: "Coding" },
      { value: "research", zh: "研究分析", en: "Research" }
    ],
    buildPrompt: ({ input, option }) => `Create a reusable high-quality prompt for this ${option} task. Include role, context, task steps, constraints, output format, and quality checklist. Return the final prompt only.\n\nTask:\n${input}`
  },
  {
    id: "code-explain",
    icon: "code",
    category: "Coding",
    title: { zh: "代码解释器", en: "Code Explainer" },
    description: {
      zh: "解释代码逻辑、潜在风险、重构建议和测试点。",
      en: "Explain code behavior, risks, refactor ideas, and test cases."
    },
    inputLabel: { zh: "代码片段", en: "Code snippet" },
    placeholder: {
      zh: "粘贴需要解释的代码...",
      en: "Paste code to explain..."
    },
    options: [
      { value: "explain", zh: "解释逻辑", en: "Explain" },
      { value: "review", zh: "代码审查", en: "Review" },
      { value: "tests", zh: "测试建议", en: "Tests" }
    ],
    buildPrompt: ({ input, option }) => `Analyze this code with mode "${option}". Be specific. Mention behavior, edge cases, risks, and practical improvements. Use code snippets only when necessary.\n\nCode:\n${input}`
  },
  {
    id: "weekly-report",
    icon: "calendar",
    category: "Work",
    title: { zh: "周报生成器", en: "Weekly Report" },
    description: {
      zh: "把零散工作记录变成日报、周报、复盘或项目进展。",
      en: "Convert raw work notes into daily reports, weekly reports, or project updates."
    },
    inputLabel: { zh: "工作记录", en: "Work notes" },
    placeholder: {
      zh: "粘贴本周完成事项、问题、计划...",
      en: "Paste completed work, blockers, and next plans..."
    },
    options: [
      { value: "weekly", zh: "周报", en: "Weekly" },
      { value: "daily", zh: "日报", en: "Daily" },
      { value: "retro", zh: "复盘", en: "Retrospective" }
    ],
    buildPrompt: ({ input, option }) => `Turn these work notes into a polished ${option} report. Keep it concrete, honest, and useful for a manager or team. Include completed work, impact, blockers, and next steps.\n\nNotes:\n${input}`
  },
  {
    id: "translate",
    icon: "globe",
    category: "Language",
    title: { zh: "双语翻译器", en: "Bilingual Translator" },
    description: {
      zh: "中英互译、保留语气，并可生成适合产品或技术场景的表达。",
      en: "Translate between Chinese and English while preserving tone and domain context."
    },
    inputLabel: { zh: "待翻译内容", en: "Text to translate" },
    placeholder: {
      zh: "粘贴要翻译的文字...",
      en: "Paste text to translate..."
    },
    options: [
      { value: "natural", zh: "自然表达", en: "Natural" },
      { value: "product", zh: "产品语气", en: "Product tone" },
      { value: "technical", zh: "技术语气", en: "Technical" }
    ],
    buildPrompt: ({ input, option }) => `Translate the following text with "${option}" tone. If the source is Chinese, translate to English; if English, translate to Chinese; if mixed, provide a clean bilingual version. Preserve meaning and nuance.\n\nText:\n${input}`
  },
  {
    id: "social-post",
    icon: "megaphone",
    category: "Marketing",
    title: { zh: "社媒帖子生成器", en: "Social Post Maker" },
    description: {
      zh: "根据主题生成小红书、Twitter/X、LinkedIn 或公众号风格内容。",
      en: "Draft posts for Xiaohongshu, Twitter/X, LinkedIn, or newsletter-style channels."
    },
    inputLabel: { zh: "主题和素材", en: "Topic and material" },
    placeholder: {
      zh: "例如：介绍一个 AI 小工具集合，受众是开发者和运营同学...",
      en: "Example: introduce an AI tools kit for developers and operators..."
    },
    options: [
      { value: "xiaohongshu", zh: "小红书", en: "Xiaohongshu" },
      { value: "twitter", zh: "Twitter/X", en: "Twitter/X" },
      { value: "linkedin", zh: "LinkedIn", en: "LinkedIn" }
    ],
    buildPrompt: ({ input, option }) => `Write a high-quality ${option} post from this material. Include a strong hook, clear value, concise structure, and a soft call to action. Avoid hype and empty claims.\n\nMaterial:\n${input}`
  },
  {
    id: "idea-lab",
    icon: "bulb",
    category: "Creative",
    title: { zh: "创意发散器", en: "Idea Lab" },
    description: {
      zh: "围绕一个目标生成命名、功能点、内容选题或产品小实验。",
      en: "Generate names, features, content angles, or product experiments from one goal."
    },
    inputLabel: { zh: "目标或问题", en: "Goal or problem" },
    placeholder: {
      zh: "例如：给一个面向独立开发者的 AI 工具箱起名字...",
      en: "Example: name an AI toolkit for indie developers..."
    },
    options: [
      { value: "names", zh: "命名", en: "Names" },
      { value: "features", zh: "功能点", en: "Features" },
      { value: "experiments", zh: "小实验", en: "Experiments" }
    ],
    buildPrompt: ({ input, option }) => `Brainstorm practical ${option} for this goal. Prefer useful, memorable, low-cost ideas. Group results and briefly explain why the best ones work.\n\nGoal:\n${input}`
  }
];

export const tools = [...builtInTools, ...loadCustomTools()];

export function getTool(id) {
  return tools.find((tool) => tool.id === id);
}

export function getCustomToolsFilePath() {
  return process.env.AI_TOOLS_CUSTOM_FILE || path.resolve(process.cwd(), "tools/custom.json");
}

export function validateCustomTools(filePath = getCustomToolsFilePath()) {
  const result = {
    ok: true,
    filePath,
    exists: fs.existsSync(filePath),
    count: 0,
    errors: [],
    warnings: []
  };

  if (!result.exists) {
    result.warnings.push("Custom tools file does not exist. This is fine unless you expected local tools.");
    return result;
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    result.ok = false;
    result.errors.push(`Invalid JSON: ${error.message}`);
    return result;
  }

  const items = Array.isArray(parsed) ? parsed : parsed.tools;
  if (!Array.isArray(items)) {
    result.ok = false;
    result.errors.push('Custom tools file must contain an array or {"tools": []}.');
    return result;
  }

  const ids = new Set(builtInTools.map((tool) => tool.id));
  items.forEach((item, index) => {
    const label = `tools[${index}]`;
    for (const key of ["id", "title", "description", "inputLabel", "placeholder", "promptTemplate"]) {
      if (!item?.[key]) {
        result.errors.push(`${label} is missing "${key}".`);
      }
    }
    if (item?.id) {
      if (ids.has(String(item.id))) {
        result.errors.push(`${label} id "${item.id}" duplicates another tool.`);
      }
      ids.add(String(item.id));
    }
    if (item?.options !== undefined && (!Array.isArray(item.options) || !item.options.length)) {
      result.errors.push(`${label} options must be a non-empty array when provided.`);
    }
    if (item?.variables !== undefined) {
      if (!Array.isArray(item.variables)) {
        result.errors.push(`${label} variables must be an array when provided.`);
      } else {
        const variableNames = new Set();
        item.variables.forEach((variable, variableIndex) => {
          const variableLabel = `${label}.variables[${variableIndex}]`;
          if (!variable?.name || !isValidVariableName(variable.name)) {
            result.errors.push(`${variableLabel} must include a valid name.`);
          } else if (variableNames.has(String(variable.name))) {
            result.errors.push(`${variableLabel} name "${variable.name}" is duplicated.`);
          } else {
            variableNames.add(String(variable.name));
          }
          if (variable?.type && !["text", "textarea", "select"].includes(variable.type)) {
            result.errors.push(`${variableLabel} type must be text, textarea, or select.`);
          }
          if (variable?.type === "select" && (!Array.isArray(variable.options) || !variable.options.length)) {
            result.errors.push(`${variableLabel} select variables require non-empty options.`);
          }
        });
      }
    }
  });

  result.count = items.length;
  result.ok = result.errors.length === 0;
  return result;
}

export function buildToolPrompt({ toolId, input, option, language = "zh", variables = {} }) {
  const tool = getTool(toolId);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolId}`);
  }
  const selectedLanguage = languages[language] ?? languages.zh;
  return [
    "You are an expert AI productivity assistant.",
    "Be accurate, practical, concise, and directly useful.",
    selectedLanguage.instruction,
    "",
    tool.buildPrompt({ input, option: option || tool.options[0].value, language, variables })
  ].join("\n");
}

function loadCustomTools() {
  const validation = validateCustomTools();
  if (!validation.exists || !validation.ok) {
    return [];
  }

  const parsed = JSON.parse(fs.readFileSync(validation.filePath, "utf8"));
  const items = Array.isArray(parsed) ? parsed : parsed.tools;
  return items.map((item) => normalizeCustomTool(item));
}

function normalizeCustomTool(item) {
  const options = Array.isArray(item.options) && item.options.length
    ? item.options
    : [{ value: "default", zh: "默认", en: "Default" }];
  const promptTemplate = String(item.promptTemplate);
  const variables = normalizeVariables(item.variables, promptTemplate);

  return {
    id: String(item.id),
    icon: item.icon || "sparkles",
    category: item.category || "Custom",
    title: normalizeLocaleText(item.title),
    description: normalizeLocaleText(item.description),
    inputLabel: normalizeLocaleText(item.inputLabel),
    placeholder: normalizeLocaleText(item.placeholder),
    options,
    variables,
    custom: true,
    buildPrompt: ({ input, option, language, variables: values }) => renderPromptTemplate(promptTemplate, {
      input,
      option: option || options[0].value,
      language,
      variables,
      values
    })
  };
}

function normalizeLocaleText(value) {
  if (typeof value === "string") {
    return { zh: value, en: value };
  }
  return {
    zh: value.zh || value.en || "",
    en: value.en || value.zh || ""
  };
}

function normalizeVariables(variables, promptTemplate) {
  const explicit = Array.isArray(variables) ? variables.map((variable) => normalizeVariable(variable)) : [];
  const knownNames = new Set(explicit.map((variable) => variable.name));
  const inferred = extractTemplateVariables(promptTemplate)
    .filter((name) => !knownNames.has(name))
    .map((name) => normalizeVariable({ name }));
  return [...explicit, ...inferred];
}

function normalizeVariable(variable) {
  const type = ["text", "textarea", "select"].includes(variable.type) ? variable.type : "text";
  return {
    name: String(variable.name),
    label: normalizeLocaleText(variable.label || variable.name),
    placeholder: normalizeLocaleText(variable.placeholder || ""),
    default: variable.default === undefined ? "" : String(variable.default),
    required: Boolean(variable.required),
    type,
    options: Array.isArray(variable.options) ? variable.options.map((option) => normalizeVariableOption(option)) : []
  };
}

function normalizeVariableOption(option) {
  if (typeof option === "string") {
    return { value: option, zh: option, en: option };
  }
  return {
    value: String(option.value),
    zh: option.zh || option.en || String(option.value),
    en: option.en || option.zh || String(option.value)
  };
}

function renderPromptTemplate(template, { input, option, language, variables, values = {} }) {
  const payload = {
    input,
    option,
    language,
    ...resolveVariableValues(variables, values)
  };
  return String(template).replace(/{{\s*([A-Za-z_][\w-]*)\s*}}/g, (match, name) => {
    if (payload[name] === undefined) {
      return match;
    }
    return String(payload[name]);
  });
}

function resolveVariableValues(variables, values) {
  return variables.reduce((resolved, variable) => {
    const raw = values?.[variable.name];
    const value = raw === undefined || raw === null || raw === "" ? variable.default : raw;
    if (variable.required && String(value || "").trim() === "") {
      throw new Error(`Variable "${variable.name}" is required.`);
    }
    resolved[variable.name] = value;
    return resolved;
  }, {});
}

function extractTemplateVariables(template) {
  const reserved = new Set(["input", "option", "language"]);
  const names = new Set();
  for (const match of String(template).matchAll(/{{\s*([A-Za-z_][\w-]*)\s*}}/g)) {
    if (!reserved.has(match[1])) {
      names.add(match[1]);
    }
  }
  return [...names];
}

function isValidVariableName(name) {
  return /^[A-Za-z_][\w-]*$/.test(String(name));
}
