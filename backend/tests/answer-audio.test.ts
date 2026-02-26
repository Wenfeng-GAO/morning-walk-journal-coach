import request from "supertest";
import { describe, expect, it } from "vitest";

import { buildApp } from "../src/app";

describe("answer turn audio", () => {
  it("accepts audioUrl payload and uses stt adapter", async () => {
    const app = buildApp({ useMockAdapters: true });
    await app.ready();

    const start = await request(app.server).post("/sessions/start").send({
      userId: "u-1",
      templateVersion: "daily-v1"
    });

    const res = await request(app.server)
      .post(`/sessions/${start.body.sessionId}/answer`)
      .send({ audioUrl: "https://example.com/a.m4a" });

    expect(res.status).toBe(200);
    expect(res.body.usedInputType).toBe("audio");

    await app.close();
  });
});
