import request from "supertest";
import { describe, expect, it } from "vitest";

import { buildApp } from "../src/app";

describe("finalize session", () => {
  it("returns final markdown after dialogue completes", async () => {
    const app = buildApp();
    await app.ready();

    const start = await request(app.server).post("/sessions/start").send({
      userId: "u-1",
      templateVersion: "daily-v1"
    });

    const sessionId = start.body.sessionId as string;

    for (let i = 0; i < 9; i += 1) {
      await request(app.server)
        .post(`/sessions/${sessionId}/answer`)
        .send({ transcript: `回答-${i}` });
    }

    const res = await request(app.server)
      .post(`/sessions/${sessionId}/finalize`)
      .send({});

    expect(res.status).toBe(200);
    expect(String(res.body.markdown)).toContain("## 今天最重要的 3 件事（结果导向）");

    await app.close();
  });
});
