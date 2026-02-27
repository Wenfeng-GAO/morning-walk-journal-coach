import { describe, expect, it } from "vitest";

import { loadLlmConfigFromFile } from "../src/config/llm-config";

describe("llm config loader", () => {
  it("loads valid llm config", () => {
    const config = loadLlmConfigFromFile("tests/fixtures/llm-config.valid.json");

    expect(config.activeProvider).toBe("moonshot");
    expect(config.resolved.model).toBe("kimi-k2.5");
    expect(config.resolved.apiKey).toBe("msk-test");
    expect(config.resolved.baseUrl).toBe("https://api.moonshot.cn/v1");
  });
});
