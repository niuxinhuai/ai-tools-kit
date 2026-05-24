const providerDefaults = {
  openai: {
    type: "openai-compatible",
    baseUrl: "https://api.openai.com/v1",
    keyEnv: "OPENAI_API_KEY",
    model: "gpt-4o-mini"
  },
  "openai-compatible": {
    type: "openai-compatible",
    baseUrl: "https://api.openai.com/v1",
    keyEnv: "OPENAI_API_KEY",
    model: "gpt-4o-mini"
  },
  deepseek: {
    type: "openai-compatible",
    baseUrl: "https://api.deepseek.com",
    keyEnv: "DEEPSEEK_API_KEY",
    model: "deepseek-chat"
  },
  qwen: {
    type: "openai-compatible",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    keyEnv: "QWEN_API_KEY",
    model: "qwen-plus"
  },
  doubao: {
    type: "openai-compatible",
    baseUrl: "",
    keyEnv: "DOUBAO_API_KEY",
    model: "doubao-seed-1-6"
  },
  moonshot: {
    type: "openai-compatible",
    baseUrl: "https://api.moonshot.cn/v1",
    keyEnv: "MOONSHOT_API_KEY",
    model: "moonshot-v1-8k"
  },
  gemini: {
    type: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    keyEnv: "GEMINI_API_KEY",
    model: "gemini-1.5-flash"
  },
  anthropic: {
    type: "anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    keyEnv: "ANTHROPIC_API_KEY",
    model: "claude-3-5-haiku-latest"
  },
  ollama: {
    type: "ollama",
    baseUrl: "http://localhost:11434",
    keyEnv: "",
    model: "llama3.1"
  },
  mock: {
    type: "mock",
    baseUrl: "",
    keyEnv: "",
    model: "mock"
  }
};

export function listProviders() {
  return Object.keys(providerDefaults);
}

export function diagnoseProvider(overrides = {}) {
  const requestedName = normalizeProvider(overrides.provider || process.env.AI_PROVIDER || "mock");
  const defaults = providerDefaults[requestedName];
  if (!defaults) {
    return {
      ok: false,
      level: "error",
      provider: requestedName,
      model: "",
      baseUrl: "",
      hasApiKey: false,
      issues: [`Unknown provider "${requestedName}". Use one of: ${listProviders().join(", ")}.`]
    };
  }

  const resolved = resolveProvider(overrides);
  const issues = [];
  const warnings = [];

  if (resolved.type !== "mock" && resolved.type !== "ollama" && !resolved.apiKey) {
    issues.push(`Missing API key. Set ${defaults.keyEnv} or AI_API_KEY.`);
  }
  if (resolved.type === "openai-compatible" && !resolved.baseUrl) {
    issues.push(`Missing base URL. Set ${requestedName.toUpperCase().replaceAll("-", "_")}_BASE_URL or AI_BASE_URL.`);
  }
  if (!resolved.model) {
    issues.push("Missing model. Set AI_MODEL or a provider-specific model variable.");
  }
  if (resolved.type === "mock") {
    warnings.push("Mock mode is active. It is useful for local tests but does not call a real model.");
  }

  return {
    ok: issues.length === 0,
    level: issues.length ? "error" : warnings.length ? "warning" : "ok",
    provider: resolved.name,
    type: resolved.type,
    model: resolved.model,
    baseUrl: resolved.baseUrl,
    hasApiKey: Boolean(resolved.apiKey),
    keyEnv: defaults.keyEnv || "",
    issues,
    warnings
  };
}

export function resolveProvider(overrides = {}) {
  const name = normalizeProvider(overrides.provider || process.env.AI_PROVIDER || "mock");
  const defaults = providerDefaults[name] ?? providerDefaults.mock;
  const upperName = name.toUpperCase().replaceAll("-", "_");
  const baseUrl =
    overrides.baseUrl ||
    process.env[`${upperName}_BASE_URL`] ||
    process.env.AI_BASE_URL ||
    defaults.baseUrl;
  const apiKey =
    overrides.apiKey ||
    process.env[defaults.keyEnv] ||
    process.env.AI_API_KEY ||
    "";
  const model =
    overrides.model ||
    process.env.AI_MODEL ||
    process.env[`${upperName}_MODEL`] ||
    defaults.model;

  return {
    name,
    type: defaults.type,
    baseUrl,
    apiKey,
    model
  };
}

export async function generateText({ prompt, provider, temperature = 0.4 }) {
  const resolved = resolveProvider(provider);

  if (resolved.type === "mock") {
    return mockResponse(prompt, resolved);
  }
  if (resolved.type !== "ollama" && !resolved.apiKey) {
    throw new Error(`Missing API key for provider "${resolved.name}". Check .env.example for the expected variable.`);
  }
  if (resolved.type === "openai-compatible" && !resolved.baseUrl) {
    throw new Error(`Missing base URL for provider "${resolved.name}". Set ${resolved.name.toUpperCase()}_BASE_URL or AI_BASE_URL.`);
  }

  if (resolved.type === "openai-compatible") {
    return requestOpenAICompatible({ prompt, provider: resolved, temperature });
  }
  if (resolved.type === "gemini") {
    return requestGemini({ prompt, provider: resolved, temperature });
  }
  if (resolved.type === "anthropic") {
    return requestAnthropic({ prompt, provider: resolved, temperature });
  }
  if (resolved.type === "ollama") {
    return requestOllama({ prompt, provider: resolved, temperature });
  }
  throw new Error(`Unsupported provider type: ${resolved.type}`);
}

export async function* generateTextStream({ prompt, provider, temperature = 0.4 }) {
  const resolved = resolveProvider(provider);

  if (resolved.type === "mock") {
    yield* streamText(mockResponse(prompt, resolved), 34);
    return;
  }
  if (resolved.type !== "ollama" && !resolved.apiKey) {
    throw new Error(`Missing API key for provider "${resolved.name}". Check .env.example for the expected variable.`);
  }
  if (resolved.type === "openai-compatible" && !resolved.baseUrl) {
    throw new Error(`Missing base URL for provider "${resolved.name}". Set ${resolved.name.toUpperCase()}_BASE_URL or AI_BASE_URL.`);
  }

  if (resolved.type === "openai-compatible") {
    yield* requestOpenAICompatibleStream({ prompt, provider: resolved, temperature });
    return;
  }
  if (resolved.type === "ollama") {
    yield* requestOllamaStream({ prompt, provider: resolved, temperature });
    return;
  }

  const output = await generateText({ prompt, provider: resolved, temperature });
  yield output;
}

async function requestOpenAICompatible({ prompt, provider, temperature }) {
  const response = await fetch(`${trimSlash(provider.baseUrl)}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`
    },
    body: JSON.stringify({
      model: provider.model,
      temperature,
      messages: [
        { role: "system", content: "You are a helpful AI assistant." },
        { role: "user", content: prompt }
      ]
    })
  });
  const data = await readJson(response);
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function* requestOpenAICompatibleStream({ prompt, provider, temperature }) {
  const response = await fetch(`${trimSlash(provider.baseUrl)}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`
    },
    body: JSON.stringify({
      model: provider.model,
      temperature,
      stream: true,
      messages: [
        { role: "system", content: "You are a helpful AI assistant." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok || !response.body) {
    const data = await readJson(response);
    throw new Error(data.error?.message || data.message || response.statusText);
  }

  const decoder = new TextDecoder();
  let buffer = "";
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) {
        continue;
      }
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") {
        return;
      }
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      } catch {
        continue;
      }
    }
  }
}

async function requestGemini({ prompt, provider, temperature }) {
  const url = `${trimSlash(provider.baseUrl)}/models/${encodeURIComponent(provider.model)}:generateContent?key=${encodeURIComponent(provider.apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: { temperature },
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    })
  });
  const data = await readJson(response);
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || "";
}

async function requestAnthropic({ prompt, provider, temperature }) {
  const response = await fetch(`${trimSlash(provider.baseUrl)}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": provider.apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 1600,
      temperature,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await readJson(response);
  return data.content?.map((part) => part.text || "").join("").trim() || "";
}

async function requestOllama({ prompt, provider, temperature }) {
  const response = await fetch(`${trimSlash(provider.baseUrl)}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: provider.model,
      prompt,
      stream: false,
      options: { temperature }
    })
  });
  const data = await readJson(response);
  return data.response?.trim() || "";
}

async function* requestOllamaStream({ prompt, provider, temperature }) {
  const response = await fetch(`${trimSlash(provider.baseUrl)}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: provider.model,
      prompt,
      stream: true,
      options: { temperature }
    })
  });

  if (!response.ok || !response.body) {
    const data = await readJson(response);
    throw new Error(data.error || data.message || response.statusText);
  }

  const decoder = new TextDecoder();
  let buffer = "";
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }
      const data = JSON.parse(line);
      if (data.response) {
        yield data.response;
      }
      if (data.done) {
        return;
      }
    }
  }
}

async function readJson(response) {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Provider returned non-JSON response: ${text.slice(0, 240)}`);
  }
  if (!response.ok) {
    const message = data.error?.message || data.message || response.statusText;
    throw new Error(`Provider request failed (${response.status}): ${message}`);
  }
  return data;
}

function mockResponse(prompt, provider) {
  const preview = prompt.replace(/\s+/g, " ").slice(0, 180);
  return [
    `Mock provider: ${provider.model}`,
    "",
    "This is a local demo response. Set AI_PROVIDER and the matching API key in .env to call a real model.",
    "",
    `Prompt preview: ${preview}${prompt.length > 180 ? "..." : ""}`
  ].join("\n");
}

async function* streamText(text, chunkSize) {
  for (let index = 0; index < text.length; index += chunkSize) {
    yield text.slice(index, index + chunkSize);
    await new Promise((resolve) => setTimeout(resolve, 12));
  }
}

function normalizeProvider(value) {
  return String(value || "mock").trim().toLowerCase();
}

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}
