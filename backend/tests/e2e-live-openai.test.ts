import request from "supertest";
import { describe, expect, it } from "vitest";

import { buildApp } from "../src/app";

const runLive =
  process.env.RUN_LIVE_E2E === "1" && typeof process.env.OPENAI_API_KEY === "string";

const liveIt = runLive ? it : it.skip;

describe("e2e live openai smoke", () => {
  liveIt(
    "completes start->answer->finalize with real llm",
    async () => {
      const app = buildApp({
        llmMode: "openai",
        openAiApiKey: process.env.OPENAI_API_KEY,
        openAiModel: process.env.OPENAI_MODEL,
        openAiBaseUrl: process.env.OPENAI_BASE_URL,
        useMockAdapters: false
      });
      await app.ready();

      const api = request(app.server);
      const start = await api.post("/sessions/start").send({
        userId: "live-user",
        templateVersion: "daily-v1"
      });

      expect(start.status).toBe(200);
      const sessionId = start.body.sessionId as string;

      for (let i = 0; i < 9; i += 1) {
        const answer = await api
          .post(`/sessions/${sessionId}/answer`)
          .send({ transcript: `live test answer ${i + 1}` });

        expect(answer.status).toBe(200);
      }

      const done = await api.post(`/sessions/${sessionId}/finalize`).send({});

      expect(done.status).toBe(200);
      expect(String(done.body.markdown)).toContain("## 昨天的事实与进展（客观 + 证据）");
      expect(String(done.body.markdown)).toContain("## 今天最重要的 3 件事（结果导向）");
      expect(String(done.body.markdown)).toContain("## 晚间复盘");

      await app.close();
    },
    120000
  );
});
