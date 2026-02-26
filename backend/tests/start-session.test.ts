import request from "supertest";
import { describe, expect, it } from "vitest";

import { buildApp } from "../src/app";

describe("start session", () => {
  it("creates a session and returns first question", async () => {
    const app = buildApp();
    await app.ready();

    const res = await request(app.server).post("/sessions/start").send({
      userId: "u-1",
      templateVersion: "daily-v1"
    });

    expect(res.status).toBe(200);
    expect(res.body.sessionId).toMatch(/^sess_[a-z0-9]{8}$/);
    expect(String(res.body.question)).toContain("昨天");
    expect(res.body.turnIndex).toBe(0);

    await app.close();
  });
});
