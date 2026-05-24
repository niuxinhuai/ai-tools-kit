const state = {
  tools: [],
  languages: {},
  providers: [],
  activeToolId: "rewrite",
  language: localStorage.getItem("ai-tools-language") || "zh",
  locale: "zh",
  activeMeta: null,
  providerStatus: null,
  history: loadHistory()
};

const ui = {
  zh: {
    tagline: "网页 + CLI 双语 AI 小工具",
    search: "搜索工具 / Search tools",
    language: "语言",
    mode: "模式",
    provider: "Provider",
    model: "模型",
    apiToken: "API Token",
    modelPlaceholder: "使用 Provider 默认模型",
    copy: "复制",
    copied: "已复制",
    import: "导入",
    prompt: "Prompt",
    debug: "调试",
    sample: "示例",
    run: "运行工具",
    running: "生成中",
    generating: "正在生成...",
    failed: "失败",
    ready: "就绪",
    output: "输出",
    history: "历史记录",
    historySearch: "搜索历史",
    allTools: "全部工具",
    clear: "清空",
    delete: "删除",
    rerun: "重跑",
    emptyInput: "请先输入内容。",
    emptyOutput: "选择一个工具，粘贴内容，然后运行。",
    emptyHistory: "还没有历史记录。",
    chars: (count) => `${count} 字符`,
    imported: (name) => `已导入 ${name}`,
    fileTooLarge: "文件太大，请选择 1MB 以内的文本文件。",
    exportEmpty: "当前没有可导出的结果。",
    exported: (format) => `已导出 ${format.toUpperCase()}`
  },
  en: {
    tagline: "Web + CLI bilingual AI tools",
    search: "Search tools",
    language: "Language",
    mode: "Mode",
    provider: "Provider",
    model: "Model",
    apiToken: "API Token",
    modelPlaceholder: "Use provider default",
    copy: "Copy",
    copied: "Copied",
    import: "Import",
    prompt: "Prompt",
    debug: "Debug",
    sample: "Sample",
    run: "Run Tool",
    running: "Running",
    generating: "Generating...",
    failed: "Failed",
    ready: "Ready",
    output: "Output",
    history: "History",
    historySearch: "Search history",
    allTools: "All tools",
    clear: "Clear",
    delete: "Delete",
    rerun: "Rerun",
    emptyInput: "Please enter some text first.",
    emptyOutput: "Choose a tool, paste your input, then run it.",
    emptyHistory: "No history yet.",
    chars: (count) => `${count} chars`,
    imported: (name) => `Imported ${name}`,
    fileTooLarge: "File is too large. Please choose a text file under 1MB.",
    exportEmpty: "There is no result to export yet.",
    exported: (format) => `Exported ${format.toUpperCase()}`
  }
};

const samples = {
  rewrite: "我们这个产品可以帮助大家更快完成工作，然后也比较简单易用，希望你能帮我改得更自然一点。",
  summarize: "本周完成了 AI 工具箱的 Web 与 CLI 方案设计，确认支持多 Provider、双语输出和本地 mock 模式。待解决问题是远端仓库需要用户先创建，后续要补充截图和发布说明。",
  prompt: "帮我写一个提示词，让 AI 作为资深产品经理，分析一个会员中心页面并输出改版建议。",
  "code-explain": "async function loadUser(id) {\n  const res = await fetch('/api/users/' + id)\n  return await res.json()\n}",
  "weekly-report": "完成：搭建 AI 工具箱项目；实现 Provider 适配；补 CLI。\n问题：GitHub 远端仓库需手动创建。\n下周：补测试、截图、发布 README。",
  translate: "这个工具可以同时作为网页应用和命令行工具使用，适合开发者、运营和内容团队。",
  "social-post": "AI Tools Kit 是一个开源小工具集合，支持 Web 和 CLI，内置改写、总结、Prompt 生成、代码解释和周报生成。",
  "idea-lab": "为面向独立开发者和运营同学的 AI 工具箱设计功能点。"
};

const icons = {
  pen: "M5 19l4.2-1 9.1-9.1a2.1 2.1 0 0 0-3-3L7.2 15 6 19z",
  sparkles: "M12 3l1.7 4.4L18 9l-4.3 1.6L12 15l-1.7-4.4L6 9l4.3-1.6L12 3z M5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14z",
  wand: "M4 20l10-10 M13 4l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z M18 13l.7 1.8 1.8.7-1.8.7L18 19l-.7-1.8-1.8-.7 1.8-.7L18 13z",
  code: "M8 8l-4 4 4 4 M16 8l4 4-4 4 M14 5l-4 14",
  calendar: "M6 4v3 M18 4v3 M4 8h16 M5 6h14v14H5z",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c2.3 2.4 3.3 5.3 3.3 9s-1 6.6-3.3 9c-2.3-2.4-3.3-5.3-3.3-9S9.7 5.4 12 3z",
  megaphone: "M4 13V8h4l10-4v13L8 13H4z M8 13l2 5",
  bulb: "M9 18h6 M10 21h4 M8 10a4 4 0 1 1 8 0c0 2.8-2 3.2-2 6h-4c0-2.8-2-3.2-2-6z"
};

const elements = {
  toolList: document.querySelector("#toolList"),
  searchInput: document.querySelector("#searchInput"),
  toolCategory: document.querySelector("#toolCategory"),
  toolTitle: document.querySelector("#toolTitle"),
  providerBadge: document.querySelector("#providerBadge"),
  languageSelect: document.querySelector("#languageSelect"),
  optionSelect: document.querySelector("#optionSelect"),
  providerSelect: document.querySelector("#providerSelect"),
  providerNotice: document.querySelector("#providerNotice"),
  modelInput: document.querySelector("#modelInput"),
  apiTokenInput: document.querySelector("#apiTokenInput"),
  inputLabel: document.querySelector("#inputLabel"),
  variableFields: document.querySelector("#variableFields"),
  inputText: document.querySelector("#inputText"),
  outputText: document.querySelector("#outputText"),
  runButton: document.querySelector("#runButton"),
  sampleButton: document.querySelector("#sampleButton"),
  promptButton: document.querySelector("#promptButton"),
  debugButton: document.querySelector("#debugButton"),
  fileButton: document.querySelector("#fileButton"),
  fileInput: document.querySelector("#fileInput"),
  copyButton: document.querySelector("#copyButton"),
  charCount: document.querySelector("#charCount"),
  runMeta: document.querySelector("#runMeta"),
  clearHistoryButton: document.querySelector("#clearHistoryButton"),
  historySearchInput: document.querySelector("#historySearchInput"),
  historyToolSelect: document.querySelector("#historyToolSelect"),
  historyList: document.querySelector("#historyList"),
  exportButtons: document.querySelectorAll("[data-export]")
};

init();

async function init() {
  const meta = await fetchJson("/api/meta");
  state.tools = meta.tools;
  state.languages = meta.languages;
  state.providers = meta.providers;
  state.providerStatus = meta.providerStatus;
  state.locale = state.language === "en" ? "en" : "zh";
  elements.providerBadge.textContent = `${meta.activeProvider.name} / ${meta.activeProvider.model}`;
  renderControls();
  selectTool(state.activeToolId);
  applyLocale();
  renderToolList();
  renderHistory();
  bindEvents();
}

function bindEvents() {
  elements.searchInput.addEventListener("input", renderToolList);
  elements.languageSelect.addEventListener("change", () => {
    state.language = elements.languageSelect.value;
    state.locale = state.language === "en" ? "en" : "zh";
    localStorage.setItem("ai-tools-language", state.language);
    applyLocale();
    renderToolList();
    selectTool(state.activeToolId, false);
    renderHistory();
  });
  elements.inputText.addEventListener("input", updateCharCount);
  elements.sampleButton.addEventListener("click", () => {
    elements.inputText.value = samples[state.activeToolId] || "";
    updateCharCount();
  });
  elements.fileButton.addEventListener("click", () => elements.fileInput.click());
  elements.fileInput.addEventListener("change", importFile);
  elements.promptButton.addEventListener("click", previewPrompt);
  elements.debugButton.addEventListener("click", debugPrompt);
  elements.runButton.addEventListener("click", runActiveTool);
  elements.clearHistoryButton.addEventListener("click", () => {
    state.history = [];
    saveHistory();
    renderHistory();
  });
  elements.historySearchInput.addEventListener("input", renderHistory);
  elements.historyToolSelect.addEventListener("change", renderHistory);
  elements.exportButtons.forEach((button) => {
    button.addEventListener("click", () => exportOutput(button.dataset.export));
  });
  elements.apiTokenInput.addEventListener("change", () => {
    localStorage.setItem("ai-tools-api-token", elements.apiTokenInput.value.trim());
  });
  elements.copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(elements.outputText.textContent);
    elements.copyButton.textContent = t("copied");
    setTimeout(() => {
      elements.copyButton.textContent = t("copy");
    }, 1200);
  });
}

function applyLocale() {
  document.documentElement.lang = state.locale === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  elements.searchInput.placeholder = t("search");
  elements.modelInput.placeholder = t("modelPlaceholder");
  elements.apiTokenInput.placeholder = "Bearer token";
  elements.apiTokenInput.value = localStorage.getItem("ai-tools-api-token") || "";
  elements.copyButton.textContent = t("copy");
  elements.fileButton.textContent = t("import");
  elements.promptButton.textContent = t("prompt");
  elements.debugButton.textContent = t("debug");
  elements.sampleButton.textContent = t("sample");
  elements.runButton.textContent = t("run");
  elements.clearHistoryButton.textContent = t("clear");
  elements.historySearchInput.placeholder = t("historySearch");
  if (elements.outputText.textContent === "Choose a tool, paste your input, then run it." || elements.outputText.textContent === "选择一个工具，粘贴内容，然后运行。") {
    elements.outputText.textContent = t("emptyOutput");
  }
  if (elements.runMeta.textContent === "Ready" || elements.runMeta.textContent === "就绪") {
    elements.runMeta.textContent = t("ready");
  }
  updateCharCount();
  renderProviderNotice();
  renderHistoryFilters();
}

function renderControls() {
  elements.languageSelect.innerHTML = Object.entries(state.languages)
    .map(([value, lang]) => `<option value="${value}">${escapeHtml(lang.label)}</option>`)
    .join("");
  elements.languageSelect.value = state.language;
  elements.providerSelect.innerHTML = state.providers
    .map((provider) => `<option value="${provider}">${provider}</option>`)
    .join("");
}

function renderHistoryFilters() {
  const current = elements.historyToolSelect.value || "all";
  elements.historyToolSelect.innerHTML = [
    `<option value="all">${escapeHtml(t("allTools"))}</option>`,
    ...state.tools.map((tool) => `<option value="${tool.id}">${escapeHtml(tool.title[state.locale] || tool.title.en)}</option>`)
  ].join("");
  elements.historyToolSelect.value = current;
}

function renderProviderNotice() {
  const status = state.providerStatus;
  if (!status || status.level === "ok") {
    elements.providerNotice.className = "provider-notice";
    elements.providerNotice.textContent = "";
    return;
  }
  const details = [...(status.issues || []), ...(status.warnings || [])].join(" ");
  elements.providerNotice.className = `provider-notice show ${status.level}`;
  elements.providerNotice.textContent = `${status.provider} / ${status.model}: ${details}`;
}

function renderToolList() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const locale = state.locale;
  const filtered = state.tools.filter((tool) => {
    const text = [tool.id, tool.category, tool.title.zh, tool.title.en, tool.description.zh, tool.description.en]
      .join(" ")
      .toLowerCase();
    return text.includes(query);
  });
  elements.toolList.innerHTML = filtered
    .map((tool) => {
      const title = tool.title[locale] || tool.title.en;
      const description = tool.description[locale] || tool.description.en;
      return `<button class="tool-card ${tool.id === state.activeToolId ? "active" : ""}" data-tool-id="${tool.id}" type="button">
        <span class="tool-icon">${renderIcon(tool.icon)}</span>
        <span>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(description)}</span>
        </span>
      </button>`;
    })
    .join("");
  elements.toolList.querySelectorAll("[data-tool-id]").forEach((button) => {
    button.addEventListener("click", () => selectTool(button.dataset.toolId));
  });
}

function selectTool(toolId, shouldRenderList = true) {
  const tool = state.tools.find((item) => item.id === toolId) || state.tools[0];
  state.activeToolId = tool.id;
  const locale = state.locale;
  elements.toolCategory.textContent = tool.category;
  elements.toolTitle.textContent = tool.title[locale] || tool.title.en;
  elements.inputLabel.textContent = tool.inputLabel[locale] || tool.inputLabel.en;
  elements.inputText.placeholder = tool.placeholder[locale] || tool.placeholder.en;
  renderVariableFields(tool);
  elements.optionSelect.innerHTML = tool.options
    .map((option) => `<option value="${option.value}">${escapeHtml(option[locale] || option.en)}</option>`)
    .join("");
  if (shouldRenderList) {
    renderToolList();
  }
}

async function runActiveTool() {
  const input = elements.inputText.value.trim();
  if (!input) {
    elements.outputText.textContent = t("emptyInput");
    return;
  }
  elements.runButton.disabled = true;
  elements.runButton.textContent = t("running");
  elements.runMeta.textContent = t("generating");
  elements.outputText.textContent = "";
  state.activeMeta = null;
  const started = performance.now();

  try {
    await streamJsonEvents("/api/run-stream", {
      toolId: state.activeToolId,
      input,
      option: elements.optionSelect.value,
      language: elements.languageSelect.value,
      variables: collectVariables(),
      provider: {
        provider: elements.providerSelect.value,
        model: elements.modelInput.value.trim()
      }
    }, (event) => {
      if (event.type === "meta") {
        state.activeMeta = event;
        elements.runMeta.textContent = `${event.provider.name} / ${event.provider.model}`;
      }
      if (event.type === "chunk") {
        elements.outputText.textContent += event.text;
      }
      if (event.type === "error") {
        throw new Error(event.error);
      }
    });
    const elapsed = Math.round(performance.now() - started);
    const provider = state.activeMeta?.provider;
    elements.runMeta.textContent = provider ? `${provider.name} / ${provider.model} / ${elapsed}ms` : `${elapsed}ms`;
    addHistory({
      toolId: state.activeToolId,
      option: elements.optionSelect.value,
      input,
      variables: collectVariables(),
      output: elements.outputText.textContent,
      provider: provider?.name || elements.providerSelect.value,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    elements.outputText.textContent = error.message;
    elements.runMeta.textContent = t("failed");
  } finally {
    elements.runButton.disabled = false;
    elements.runButton.textContent = t("run");
  }
}

async function streamJsonEvents(url, payload, onEvent) {
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  if (!response.ok || !response.body) {
    const data = await response.json();
    throw new Error(data.error || response.statusText);
  }
  const decoder = new TextDecoder();
  let buffer = "";
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const messages = buffer.split("\n\n");
    buffer = messages.pop() || "";
    for (const message of messages) {
      const line = message.split("\n").find((item) => item.startsWith("data:"));
      if (!line) {
        continue;
      }
      onEvent(JSON.parse(line.slice(5).trim()));
    }
  }
}

function importFile() {
  const file = elements.fileInput.files?.[0];
  if (!file) {
    return;
  }
  if (file.size > 1024 * 1024) {
    elements.runMeta.textContent = t("fileTooLarge");
    elements.fileInput.value = "";
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    elements.inputText.value = String(reader.result || "");
    elements.runMeta.textContent = t("imported", file.name);
    updateCharCount();
  });
  reader.readAsText(file);
  elements.fileInput.value = "";
}

async function previewPrompt() {
  const input = elements.inputText.value;
  elements.runMeta.textContent = t("generating");
  try {
    const result = await fetchJson("/api/prompt", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        toolId: state.activeToolId,
        input,
        option: elements.optionSelect.value,
        language: elements.languageSelect.value,
        variables: collectVariables()
      })
    });
    elements.outputText.textContent = result.prompt;
    elements.runMeta.textContent = "Prompt preview";
  } catch (error) {
    elements.outputText.textContent = error.message;
    elements.runMeta.textContent = t("failed");
  }
}

async function debugPrompt() {
  const input = elements.inputText.value;
  elements.runMeta.textContent = t("generating");
  try {
    const result = await fetchJson("/api/prompt-debug", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        toolId: state.activeToolId,
        input,
        option: elements.optionSelect.value,
        language: elements.languageSelect.value,
        variables: collectVariables()
      })
    });
    elements.outputText.textContent = JSON.stringify(result, null, 2);
    elements.runMeta.textContent = "Prompt debug";
  } catch (error) {
    elements.outputText.textContent = error.message;
    elements.runMeta.textContent = t("failed");
  }
}

function addHistory(item) {
  state.history = [{ id: historyId(), ...item }, ...state.history].slice(0, 24);
  saveHistory();
  renderHistory();
}

function exportOutput(format) {
  const output = elements.outputText.textContent.trim();
  if (!output || output === t("emptyOutput") || output === t("emptyInput")) {
    elements.runMeta.textContent = t("exportEmpty");
    return;
  }
  const tool = state.tools.find((item) => item.id === state.activeToolId);
  const payload = {
    toolId: state.activeToolId,
    tool: tool?.title[state.locale] || state.activeToolId,
    option: elements.optionSelect.value,
    language: elements.languageSelect.value,
    provider: state.activeMeta?.provider || {
      name: elements.providerSelect.value,
      model: elements.modelInput.value.trim()
    },
    variables: collectVariables(),
    input: elements.inputText.value,
    output,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([formatExport(payload, format)], { type: exportMime(format) });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${payload.toolId}-${Date.now()}.${format}`;
  anchor.click();
  URL.revokeObjectURL(url);
  elements.runMeta.textContent = t("exported", format);
}

function formatExport(payload, format) {
  if (format === "json") {
    return `${JSON.stringify(payload, null, 2)}\n`;
  }
  if (format === "txt") {
    return `${payload.output}\n`;
  }
  return [
    `# ${payload.tool}`,
    "",
    `- Tool ID: ${payload.toolId}`,
    `- Provider: ${payload.provider.name || ""}`,
    `- Model: ${payload.provider.model || ""}`,
    `- Option: ${payload.option}`,
    `- Language: ${payload.language}`,
    `- Exported at: ${payload.exportedAt}`,
    ...formatVariableLines(payload.variables),
    "",
    "## Input",
    "",
    payload.input,
    "",
    "## Output",
    "",
    payload.output,
    ""
  ].join("\n");
}

function exportMime(format) {
  if (format === "json") {
    return "application/json";
  }
  if (format === "txt") {
    return "text/plain";
  }
  return "text/markdown";
}

function renderHistory() {
  const query = elements.historySearchInput.value.trim().toLowerCase();
  const selectedTool = elements.historyToolSelect.value || "all";
  const items = state.history.filter((item) => {
    const matchesTool = selectedTool === "all" || item.toolId === selectedTool;
    const text = [item.toolId, item.input, item.output, item.provider].join(" ").toLowerCase();
    return matchesTool && text.includes(query);
  });

  if (!items.length) {
    elements.historyList.innerHTML = `<span class="history-empty">${escapeHtml(t("emptyHistory"))}</span>`;
    return;
  }
  elements.historyList.innerHTML = items
    .map((item, index) => {
      const tool = state.tools.find((entry) => entry.id === item.toolId);
      const title = tool?.title[state.locale] || tool?.title.en || item.toolId;
      const preview = item.output.replace(/\s+/g, " ").slice(0, 150);
      return `<div class="history-item" data-history-id="${item.id || index}">
        <button class="history-main" data-history-action="restore" type="button">
          <strong>${escapeHtml(title)} · ${escapeHtml(item.provider)}</strong>
          <span>${escapeHtml(preview)}${item.output.length > 150 ? "..." : ""}</span>
        </button>
        <div class="history-actions">
          <button data-history-action="rerun" type="button">${escapeHtml(t("rerun"))}</button>
          <button data-history-action="copy" type="button">${escapeHtml(t("copy"))}</button>
          <button data-history-action="export" type="button">MD</button>
          <button data-history-action="delete" type="button">${escapeHtml(t("delete"))}</button>
        </div>
      </div>`;
    })
    .join("");
  elements.historyList.querySelectorAll("[data-history-action]").forEach((button) => {
    button.addEventListener("click", () => handleHistoryAction(button.closest("[data-history-id]")?.dataset.historyId, button.dataset.historyAction));
  });
}

function handleHistoryAction(id, action) {
  const item = findHistoryItem(id);
  if (!item) {
    return;
  }
  if (action === "restore") {
    restoreHistory(item);
  } else if (action === "rerun") {
    restoreHistory(item);
    runActiveTool();
  } else if (action === "copy") {
    navigator.clipboard.writeText(item.output);
  } else if (action === "export") {
    downloadHistoryItem(item);
  } else if (action === "delete") {
    state.history = state.history.filter((entry) => String(entry.id) !== String(id));
    saveHistory();
    renderHistory();
  }
}

function findHistoryItem(id) {
  return state.history.find((item, index) => String(item.id || index) === String(id));
}

function restoreHistory(item) {
  selectTool(item.toolId);
  elements.optionSelect.value = item.option;
  setVariableValues(item.variables);
  elements.inputText.value = item.input;
  elements.outputText.textContent = item.output;
  elements.runMeta.textContent = `${item.provider} / ${new Date(item.createdAt).toLocaleString()}`;
  updateCharCount();
}

function downloadHistoryItem(item) {
  const tool = state.tools.find((entry) => entry.id === item.toolId);
  const payload = {
    toolId: item.toolId,
    tool: tool?.title[state.locale] || item.toolId,
    option: item.option,
    language: state.language,
    provider: { name: item.provider },
    variables: item.variables || {},
    input: item.input,
    output: item.output,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([formatExport(payload, "md")], { type: exportMime("md") });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${item.toolId}-${Date.now()}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem("ai-tools-history") || "[]")
      .map((item) => item.id ? item : { id: historyId(), ...item });
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem("ai-tools-history", JSON.stringify(state.history));
}

function historyId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function updateCharCount() {
  elements.charCount.textContent = t("chars", elements.inputText.value.length);
}

function renderVariableFields(tool) {
  const variables = tool.variables || [];
  if (!variables.length) {
    elements.variableFields.hidden = true;
    elements.variableFields.innerHTML = "";
    return;
  }
  elements.variableFields.hidden = false;
  elements.variableFields.innerHTML = variables.map((variable) => {
    const label = variable.label?.[state.locale] || variable.label?.en || variable.name;
    const placeholder = variable.placeholder?.[state.locale] || variable.placeholder?.en || "";
    const value = variable.default || "";
    const required = variable.required ? "required" : "";
    const wide = variable.type === "textarea" ? " variable-wide" : "";
    if (variable.type === "select") {
      const options = (variable.options || []).map((option) => {
        const optionLabel = option[state.locale] || option.en || option.value;
        return `<option value="${escapeHtml(option.value)}" ${option.value === value ? "selected" : ""}>${escapeHtml(optionLabel)}</option>`;
      }).join("");
      return `<label class="${wide}">
        <span>${escapeHtml(label)}</span>
        <select data-variable-name="${escapeHtml(variable.name)}" ${required}>${options}</select>
      </label>`;
    }
    if (variable.type === "textarea") {
      return `<label class="${wide}">
        <span>${escapeHtml(label)}</span>
        <textarea data-variable-name="${escapeHtml(variable.name)}" placeholder="${escapeHtml(placeholder)}" ${required}>${escapeHtml(value)}</textarea>
      </label>`;
    }
    return `<label class="${wide}">
      <span>${escapeHtml(label)}</span>
      <input data-variable-name="${escapeHtml(variable.name)}" type="text" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" ${required} />
    </label>`;
  }).join("");
}

function collectVariables() {
  const fields = elements.variableFields.querySelectorAll("[data-variable-name]");
  return Object.fromEntries([...fields].map((field) => [field.dataset.variableName, field.value]));
}

function setVariableValues(variables = {}) {
  elements.variableFields.querySelectorAll("[data-variable-name]").forEach((field) => {
    if (variables[field.dataset.variableName] !== undefined) {
      field.value = variables[field.dataset.variableName];
    }
  });
}

function formatVariableLines(variables = {}) {
  const entries = Object.entries(variables).filter(([, value]) => String(value || "").trim());
  if (!entries.length) {
    return [];
  }
  return [
    "- Variables:",
    ...entries.map(([key, value]) => `  - ${key}: ${value}`)
  ];
}

async function fetchJson(url, options) {
  const response = await fetch(url, options ? {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...authHeader()
    }
  } : { headers: authHeader() });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || response.statusText);
  }
  return data;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    ...authHeader()
  };
}

function authHeader() {
  const token = elements.apiTokenInput?.value?.trim() || localStorage.getItem("ai-tools-api-token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function renderIcon(name) {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name] || icons.sparkles}"/></svg>`;
}

function t(key, ...args) {
  const value = ui[state.locale]?.[key] ?? ui.en[key] ?? key;
  return typeof value === "function" ? value(...args) : value;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
