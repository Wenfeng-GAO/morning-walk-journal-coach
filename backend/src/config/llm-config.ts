import fs from "node:fs";
import path from "node:path";

import { z } from "zod";

const providerSchema = z.object({
  model: z.string().min(1),
  api_key: z.string().min(1),
  base_url: z.string().url()
});

const llmConfigSchema = z.object({
  active_provider: z.string().min(1),
  providers: z.record(providerSchema)
});

export const DEFAULT_LLM_CONFIG_PATH = "config/llm.local.json";

export type ResolvedProviderConfig = {
  model: string;
  apiKey: string;
  baseUrl: string;
};

export type LoadedLlmConfig = {
  activeProvider: string;
  providers: Record<string, ResolvedProviderConfig>;
  resolved: ResolvedProviderConfig;
};

function resolveFilePath(pathLike: string): string {
  if (path.isAbsolute(pathLike)) {
    return pathLike;
  }

  return path.resolve(process.cwd(), pathLike);
}

export function loadLlmConfigFromFile(pathLike: string): LoadedLlmConfig {
  const filePath = resolveFilePath(pathLike);

  if (!fs.existsSync(filePath)) {
    throw new Error(`LLM config file not found: ${filePath}`);
  }

  const rawText = fs.readFileSync(filePath, "utf8");

  let rawObject: unknown;

  try {
    rawObject = JSON.parse(rawText);
  } catch {
    throw new Error(`Invalid JSON in LLM config file: ${filePath}`);
  }

  const parsed = llmConfigSchema.safeParse(rawObject);

  if (!parsed.success) {
    throw new Error(
      `Invalid LLM config schema in ${filePath}: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`
    );
  }

  const activeProvider = parsed.data.active_provider;
  const active = parsed.data.providers[activeProvider];

  if (!active) {
    throw new Error(
      `active_provider '${activeProvider}' not found in providers for ${filePath}`
    );
  }

  const providers = Object.fromEntries(
    Object.entries(parsed.data.providers).map(([name, provider]) => [
      name,
      {
        model: provider.model,
        apiKey: provider.api_key,
        baseUrl: provider.base_url
      }
    ])
  );

  return {
    activeProvider,
    providers,
    resolved: providers[activeProvider]
  };
}
