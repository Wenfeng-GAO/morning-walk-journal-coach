import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "../src/app";

const originalFetch = global.fetch;
const envSnapshot = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  MOONSHOT_API_KEY: process.env.MOONSHOT_API_KEY,
  MOONSHOT_MODEL: process.env.MOONSHOT_MODEL,
  MOONSHOT_BASE_URL: process.env.MOONSHOT_BASE_URL
};

beforeEach(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_MODEL;
  delete process.env.OPENAI_BASE_URL;
  delete process.env.MOONSHOT_MODEL;
  delete process.env.MOONSHOT_BASE_URL;
  process.env.MOONSHOT_API_KEY = "msk-test";
});

afterEach(() => {
  process.env.OPENAI_API_KEY = envSnapshot.OPENAI_API_KEY;
  process.env.OPENAI_MODEL = envSnapshot.OPENAI_MODEL;
  process.env.OPENAI_BASE_URL = envSnapshot.OPENAI_BASE_URL;
  process.env.MOONSHOT_API_KEY = envSnapshot.MOONSHOT_API_KEY;
  process.env.MOONSHOT_MODEL = envSnapshot.MOONSHOT_MODEL;
  process.env.MOONSHOT_BASE_URL = envSnapshot.MOONSHOT_BASE_URL;

  vi.restoreAllMocks();
  global.fetch = originalFetch;
});

describe("kimi openai-compatible defaults", () => {
  it("uses moonshot key/model/base url defaults", async () => {
    const fetchMock = vi.fn(async () => {
      const body = {
        choices: [
          {
            message: {
              content: '{"nextQuestion":"Kimi下一问","nextQuestionType":"follow_up"}'
            }
          }
        ]
      };

      return new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const app = buildApp({ llmMode: "openai" });
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
    expect(answer.body.nextQuestion).toBe("Kimi下一问");

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
