import request from "supertest";
import { describe, expect, it } from "vitest";

import type { LlmAdapter } from "../src/adapters/llm";
import { buildApp } from "../src/app";

function createSessionLlm(nextQuestion: string): LlmAdapter {
  return {
    async nextQuestion() {
      return {
        nextQuestion,
        nextQuestionType: "follow_up"
      };
    },
    async summarizeToNoteInput() {
      return null;
    }
  };
}

describe("llm adapter routing", () => {
  it("uses llm next question when adapter returns one", async () => {
    const app = buildApp({ llmAdapter: createSessionLlm("LLM: 继续说细节") });
    await app.ready();

    const api = request(app.server);
    const start = await api.post("/sessions/start").send({
      userId: "u-1",
      templateVersion: "daily-v1"
    });

    const res = await api
      .post(`/sessions/${start.body.sessionId}/answer`)
      .send({ transcript: "我昨天推进了项目A" });

    expect(res.status).toBe(200);
    expect(res.body.nextQuestion).toBe("LLM: 继续说细节");
    expect(res.body.nextQuestionType).toBe("follow_up");

    await app.close();
  });

  it("falls back to policy when llm adapter throws", async () => {
    const failingAdapter: LlmAdapter = {
      async nextQuestion() {
        throw new Error("llm unavailable");
      },
      async summarizeToNoteInput() {
        return null;
      }
    };

    const app = buildApp({ llmAdapter: failingAdapter });
    await app.ready();

    const api = request(app.server);
    const start = await api.post("/sessions/start").send({
      userId: "u-1",
      templateVersion: "daily-v1"
    });

    const res = await api
      .post(`/sessions/${start.body.sessionId}/answer`)
      .send({ transcript: "我昨天推进了项目A" });

    expect(res.status).toBe(200);
    expect(res.body.nextQuestion).toBe("这件事的具体进展是什么？");
    expect(res.body.nextQuestionType).toBe("follow_up");

    await app.close();
  });

  it("uses llm summary in finalize when available", async () => {
    const adapter: LlmAdapter = {
      async nextQuestion({ fallback }) {
        return fallback;
      },
      async summarizeToNoteInput() {
        return {
          sleepAt: "23:00",
          wakeAt: "06:30",
          facts: ["[事业] 事实：LLM提炼事实"],
          review: "LLM提炼复盘",
          top3: ["LLM任务1", "LLM任务2", "LLM任务3"]
        };
      }
    };

    const app = buildApp({ llmAdapter: adapter });
    await app.ready();

    const api = request(app.server);
    const start = await api.post("/sessions/start").send({
      userId: "u-1",
      templateVersion: "daily-v1"
    });

    for (let i = 0; i < 9; i += 1) {
      await api
        .post(`/sessions/${start.body.sessionId}/answer`)
        .send({ transcript: `回答-${i}` });
    }

    const done = await api
      .post(`/sessions/${start.body.sessionId}/finalize`)
      .send({});

    expect(done.status).toBe(200);
    expect(String(done.body.markdown)).toContain("LLM任务1");
    expect(String(done.body.markdown)).toContain("LLM提炼复盘");

    await app.close();
  });
});
