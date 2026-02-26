import Fastify from "fastify";

import type { LlmAdapter } from "./adapters/llm";
import { MockLlmAdapter } from "./adapters/llm.mock";
import { NoopLlmAdapter } from "./adapters/llm.noop";
import { OpenAiLlmAdapter } from "./adapters/llm.openai";
import { MockSttAdapter } from "./adapters/stt.mock";
import { NoopSttAdapter } from "./adapters/stt.noop";
import type { SttAdapter } from "./adapters/stt";
import { registerSessionRoutes } from "./routes/session-routes";
import { InMemorySessionStore } from "./store/in-memory-session-store";

export type BuildAppOptions = {
  useMockAdapters?: boolean;
  sttAdapter?: SttAdapter;
  llmAdapter?: LlmAdapter;
  llmMode?: "noop" | "mock" | "openai";
  openAiApiKey?: string;
  openAiModel?: string;
  openAiBaseUrl?: string;
};

function resolveSttAdapter(options: BuildAppOptions): SttAdapter {
  if (options.sttAdapter) {
    return options.sttAdapter;
  }

  if (options.useMockAdapters) {
    return new MockSttAdapter();
  }

  return new NoopSttAdapter();
}

function resolveLlmAdapter(options: BuildAppOptions): LlmAdapter {
  if (options.llmAdapter) {
    return options.llmAdapter;
  }

  if (options.llmMode === "openai") {
    const apiKey = options.openAiApiKey ?? process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return new NoopLlmAdapter();
    }

    return new OpenAiLlmAdapter({
      apiKey,
      model: options.openAiModel ?? process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      baseUrl: options.openAiBaseUrl ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
    });
  }

  if (options.llmMode === "mock" || options.useMockAdapters) {
    return new MockLlmAdapter();
  }

  return new NoopLlmAdapter();
}

export function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify();
  const sessionStore = new InMemorySessionStore();
  const sttAdapter = resolveSttAdapter(options);
  const llmAdapter = resolveLlmAdapter(options);

  app.get("/health", async () => ({ status: "ok" }));
  registerSessionRoutes(app, sessionStore, sttAdapter, llmAdapter);

  return app;
}
