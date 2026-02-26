import request from "supertest";
import { describe, expect, it } from "vitest";

import { buildApp } from "../src/app";

async function answerMinimalTurnsWithAudio(baseUrl: request.SuperTest<request.Test>, sessionId: string) {
  for (let i = 0; i < 9; i += 1) {
    const res = await baseUrl
      .post(`/sessions/${sessionId}/answer`)
      .send({ audioUrl: "https://example.com/turn.m4a" });

    if (i < 8) {
      expect(res.status).toBe(200);
    }
  }
}

describe("e2e happy path", () => {
  it("completes full morning flow with mock adapters", async () => {
    const app = buildApp({ useMockAdapters: true });
    await app.ready();

    const api = request(app.server);

    const start = await api.post("/sessions/start").send({
      userId: "u-1",
      templateVersion: "daily-v1"
    });

    const sessionId = start.body.sessionId as string;

    await answerMinimalTurnsWithAudio(api, sessionId);

    const done = await api.post(`/sessions/${sessionId}/finalize`).send({});

    expect(done.status).toBe(200);
    expect(String(done.body.markdown)).toContain("## 昨天关键复盘（做对/做错/防错）");

    await app.close();
  });

  it("does not allow audio flow without mock adapters", async () => {
    const app = buildApp({ useMockAdapters: false });
    await app.ready();

    const api = request(app.server);

    const start = await api.post("/sessions/start").send({
      userId: "u-1",
      templateVersion: "daily-v1"
    });

    const res = await api
      .post(`/sessions/${start.body.sessionId}/answer`)
      .send({ audioUrl: "https://example.com/turn.m4a" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_INPUT");

    await app.close();
  });
});
