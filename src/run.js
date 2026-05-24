import { buildToolPrompt, getTool } from "./tools.js";
import { generateText, generateTextStream, resolveProvider } from "./providers.js";

export async function runTool({ toolId, input, option, language, provider, temperature, fallbackProviders, variables }) {
  if (!input || !input.trim()) {
    throw new Error("Input is required.");
  }
  const tool = getTool(toolId);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolId}`);
  }
  const selectedOption = option || tool.options[0].value;
  const prompt = buildToolPrompt({
    toolId,
    input: input.trim(),
    option: selectedOption,
    language,
    variables
  });
  const attempts = providerAttempts(provider, fallbackProviders);
  let output = "";
  let resolvedProvider;
  let lastError;

  for (const attempt of attempts) {
    resolvedProvider = resolveProvider(attempt);
    try {
      output = await generateText({
        prompt,
        provider: resolvedProvider,
        temperature: Number.isFinite(Number(temperature)) ? Number(temperature) : 0.4
      });
      lastError = undefined;
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return {
    toolId,
    option: selectedOption,
    language: language || "zh",
    provider: {
      name: resolvedProvider.name,
      model: resolvedProvider.model
    },
    variables: normalizeResultVariables(tool, variables),
    fallbackUsed: resolvedProvider.name !== resolveProvider(provider).name,
    output
  };
}

export async function* streamTool({ toolId, input, option, language, provider, temperature, variables }) {
  if (!input || !input.trim()) {
    throw new Error("Input is required.");
  }
  const tool = getTool(toolId);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolId}`);
  }
  const selectedOption = option || tool.options[0].value;
  const prompt = buildToolPrompt({
    toolId,
    input: input.trim(),
    option: selectedOption,
    language,
    variables
  });
  const resolvedProvider = resolveProvider(provider);
  yield {
    type: "meta",
    toolId,
    option: selectedOption,
    language: language || "zh",
    provider: {
      name: resolvedProvider.name,
      model: resolvedProvider.model
    },
    variables: normalizeResultVariables(tool, variables)
  };
  for await (const chunk of generateTextStream({
    prompt,
    provider: resolvedProvider,
    temperature: Number.isFinite(Number(temperature)) ? Number(temperature) : 0.4
  })) {
    yield { type: "chunk", text: chunk };
  }
  yield { type: "done" };
}

export async function runChunkedTool({ input, chunkSize = 6000, chunkOverlap = 300, ...options }) {
  const chunks = splitText(input, Number(chunkSize), Number(chunkOverlap));
  if (chunks.length <= 1) {
    return runTool({ ...options, input });
  }

  const partials = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const partial = await runTool({
      ...options,
      input: [
        `Chunk ${index + 1} of ${chunks.length}. Process this chunk for later synthesis.`,
        "",
        chunks[index]
      ].join("\n")
    });
    partials.push(partial.output);
  }

  const finalInput = partials
    .map((part, index) => `## Chunk ${index + 1}\n\n${part}`)
    .join("\n\n");
  const result = await runTool({
    ...options,
    input: [
      "Synthesize these chunk-level results into one coherent final answer. Remove duplication and preserve important details.",
      "",
      finalInput
    ].join("\n")
  });
  return {
    ...result,
    chunks: chunks.length
  };
}

export async function runWorkflow({ steps, input, provider, language, temperature, fallbackProviders, variables }) {
  if (!Array.isArray(steps) || !steps.length) {
    throw new Error("Workflow must include a non-empty steps array.");
  }

  const results = [];
  let current = input;
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    const result = await runTool({
      toolId: step.toolId || step.tool,
      option: step.option,
      input: current,
      language: step.language || language,
      provider: step.provider || provider,
      temperature: step.temperature ?? temperature,
      fallbackProviders: step.fallbackProviders || fallbackProviders,
      variables: { ...(variables || {}), ...(step.variables || {}) }
    });
    results.push({
      index: index + 1,
      name: step.name || `step-${index + 1}`,
      ...result
    });
    current = result.output;
  }

  return {
    steps: results,
    output: current
  };
}

function providerAttempts(provider, fallbackProviders) {
  const primary = provider || {};
  const fallbacks = normalizeFallbackProviders(fallbackProviders);
  return [primary, ...fallbacks.map((name) => ({ provider: name }))];
}

function normalizeFallbackProviders(value) {
  const raw = value ?? process.env.AI_FALLBACK_PROVIDERS ?? "";
  if (Array.isArray(raw)) {
    return raw;
  }
  return String(raw).split(",").map((item) => item.trim()).filter(Boolean);
}

function splitText(text, chunkSize, overlap) {
  const size = Number.isFinite(chunkSize) && chunkSize > 0 ? chunkSize : 6000;
  const safeOverlap = Number.isFinite(overlap) && overlap > 0 && overlap < size ? overlap : 0;
  const chunks = [];
  for (let index = 0; index < text.length; index += size - safeOverlap) {
    chunks.push(text.slice(index, index + size));
  }
  return chunks;
}

function normalizeResultVariables(tool, variables) {
  if (!tool.variables?.length) {
    return undefined;
  }
  return Object.fromEntries(
    tool.variables.map((variable) => [variable.name, variables?.[variable.name] ?? variable.default ?? ""])
  );
}
