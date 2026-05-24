const state = {
  tools: [],
  languages: {},
  providers: [],
  activeToolId: "rewrite",
  locale: "zh"
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
  modelInput: document.querySelector("#modelInput"),
  inputLabel: document.querySelector("#inputLabel"),
  inputText: document.querySelector("#inputText"),
  outputText: document.querySelector("#outputText"),
  runButton: document.querySelector("#runButton"),
  sampleButton: document.querySelector("#sampleButton"),
  copyButton: document.querySelector("#copyButton"),
  charCount: document.querySelector("#charCount"),
  runMeta: document.querySelector("#runMeta")
};

init();

async function init() {
  const meta = await fetchJson("/api/meta");
  state.tools = meta.tools;
  state.languages = meta.languages;
  state.providers = meta.providers;
  elements.providerBadge.textContent = `${meta.activeProvider.name} / ${meta.activeProvider.model}`;
  renderControls();
  renderToolList();
  selectTool(state.activeToolId);
  bindEvents();
}

function bindEvents() {
  elements.searchInput.addEventListener("input", renderToolList);
  elements.languageSelect.addEventListener("change", () => {
    state.locale = elements.languageSelect.value === "en" ? "en" : "zh";
    renderToolList();
    selectTool(state.activeToolId, false);
  });
  elements.inputText.addEventListener("input", updateCharCount);
  elements.sampleButton.addEventListener("click", () => {
    elements.inputText.value = samples[state.activeToolId] || "";
    updateCharCount();
  });
  elements.runButton.addEventListener("click", runActiveTool);
  elements.copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(elements.outputText.textContent);
    elements.copyButton.textContent = "Copied";
    setTimeout(() => {
      elements.copyButton.textContent = "Copy";
    }, 1200);
  });
}

function renderControls() {
  elements.languageSelect.innerHTML = Object.entries(state.languages)
    .map(([value, lang]) => `<option value="${value}">${escapeHtml(lang.label)}</option>`)
    .join("");
  elements.providerSelect.innerHTML = state.providers
    .map((provider) => `<option value="${provider}">${provider}</option>`)
    .join("");
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
    elements.outputText.textContent = "Please enter some text first.";
    return;
  }
  elements.runButton.disabled = true;
  elements.runButton.textContent = "Running";
  elements.runMeta.textContent = "Generating...";
  const started = performance.now();
  try {
    const result = await fetchJson("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toolId: state.activeToolId,
        input,
        option: elements.optionSelect.value,
        language: elements.languageSelect.value,
        provider: {
          provider: elements.providerSelect.value,
          model: elements.modelInput.value.trim()
        }
      })
    });
    elements.outputText.textContent = result.output || "(empty response)";
    elements.runMeta.textContent = `${result.provider.name} / ${result.provider.model} / ${Math.round(performance.now() - started)}ms`;
  } catch (error) {
    elements.outputText.textContent = error.message;
    elements.runMeta.textContent = "Failed";
  } finally {
    elements.runButton.disabled = false;
    elements.runButton.textContent = "Run Tool";
  }
}

function updateCharCount() {
  elements.charCount.textContent = `${elements.inputText.value.length} chars`;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || response.statusText);
  }
  return data;
}

function renderIcon(name) {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name] || icons.sparkles}"/></svg>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
