import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "../src/app";

const originalFetch = global.fetch;

afterEach(() => {
  vi.restoreAllMocks();
  global.fetch = originalFetch;
});

describe("app config integration", () => {
  it("uses llm config file for openai-compatible adapter", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: '{"nextQuestion":"来自配置文件的问题","nextQuestionType":"follow_up"}'
              }
            }
          ]
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    const app = buildApp({
      llmMode: "openai",
      llmConfigPath: "tests/fixtures/llm-config.valid.json"
    });
    await app.ready();

    const api = request(app.server);
    const start = await api.post("/sessions/start").send({
      userId: "u-1",
      templateVersion: "daily-v1"
    });

    const answer = await api
      .post(`/sessions/${start.body.sessionId}/answer`)
      .send({ transcript: "昨天推进了需求" });

    expect(answer.status).toBe(200);
    expect(answer.body.nextQuestion).toBe("来自配置文件的问题");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(init.body));
    const headers = init.headers as Record<string, string>;

    expect(url).toBe("https://api.moonshot.cn/v1/chat/completions");
    expect(headers.Authorization).toBe("Bearer msk-test");
    expect(payload.model).toBe("kimi-k2.5");

    await app.close();
  });
});
