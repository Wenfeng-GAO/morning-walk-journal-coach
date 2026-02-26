import request from "supertest";
import { describe, expect, it } from "vitest";

import { buildApp } from "../src/app";

describe("answer turn", () => {
  it("limits follow-up depth to 2 and then advances stage", async () => {
    const app = buildApp();
    await app.ready();

    const start = await request(app.server).post("/sessions/start").send({
      userId: "u-1",
      templateVersion: "daily-v1"
    });

    const sessionId = start.body.sessionId as string;

    const t1 = await request(app.server)
      .post(`/sessions/${sessionId}/answer`)
      .send({ transcript: "我推进了 A 项目" });

    const t2 = await request(app.server)
      .post(`/sessions/${sessionId}/answer`)
      .send({ transcript: "证据是 PR merged" });

    const t3 = await request(app.server)
      .post(`/sessions/${sessionId}/answer`)
      .send({ transcript: "好的" });

    expect(t1.status).toBe(200);
    expect(t2.status).toBe(200);
    expect(t3.status).toBe(200);

    expect(t1.body.nextQuestionType).toBe("follow_up");
    expect(t2.body.nextQuestionType).toBe("follow_up");
    expect(t3.body.nextQuestionType).toBe("main");

    await app.close();
  });
});
