import { buildToolPrompt, getTool } from "./tools.js";
import { generateText, generateTextStream, resolveProvider } from "./providers.js";

export async function runTool({ toolId, input, option, language, provider, temperature }) {
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
    language
  });
  const resolvedProvider = resolveProvider(provider);
  const output = await generateText({
    prompt,
    provider: resolvedProvider,
    temperature: Number.isFinite(Number(temperature)) ? Number(temperature) : 0.4
  });
  return {
    toolId,
    option: selectedOption,
    language: language || "zh",
    provider: {
      name: resolvedProvider.name,
      model: resolvedProvider.model
    },
    output
  };
}

export async function* streamTool({ toolId, input, option, language, provider, temperature }) {
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
    language
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
    }
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
