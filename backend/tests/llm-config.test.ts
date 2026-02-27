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

  it("throws when file does not exist", () => {
    expect(() => loadLlmConfigFromFile("tests/fixtures/not-exist.json")).toThrow(
      /not found/i
    );
  });

  it("throws when active provider is missing from providers", () => {
    expect(() => loadLlmConfigFromFile("tests/fixtures/llm-config.invalid.json")).toThrow(
      /active_provider/i
    );
  });

  it("throws when json is invalid", () => {
    expect(() => loadLlmConfigFromFile("tests/fixtures/llm-config.bad-json.json")).toThrow(
      /invalid json/i
    );
  });
});
