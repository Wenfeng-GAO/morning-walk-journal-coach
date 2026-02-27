import Fastify from "fastify";

import type { LlmAdapter } from "./adapters/llm";
import { MockLlmAdapter } from "./adapters/llm.mock";
import { NoopLlmAdapter } from "./adapters/llm.noop";
import { OpenAiLlmAdapter } from "./adapters/llm.openai";
import { MockSttAdapter } from "./adapters/stt.mock";
import { NoopSttAdapter } from "./adapters/stt.noop";
import type { SttAdapter } from "./adapters/stt";
import {
  DEFAULT_LLM_CONFIG_PATH,
  loadLlmConfigFromFile
} from "./config/llm-config";
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
  llmConfigPath?: string;
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
    const explicitApiKey = options.openAiApiKey;

    if (explicitApiKey) {
      return new OpenAiLlmAdapter({
        apiKey: explicitApiKey,
        model: options.openAiModel ?? "kimi-k2.5",
        baseUrl: options.openAiBaseUrl ?? "https://api.moonshot.cn/v1"
      });
    }

    const config = loadLlmConfigFromFile(
      options.llmConfigPath ?? DEFAULT_LLM_CONFIG_PATH
    );

    return new OpenAiLlmAdapter({
      apiKey: config.resolved.apiKey,
      model: config.resolved.model,
      baseUrl: config.resolved.baseUrl
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
