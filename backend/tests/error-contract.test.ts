import request from "supertest";
import { describe, expect, it } from "vitest";

import { buildApp } from "../src/app";

describe("error contract", () => {
  it("returns 404 for unknown session", async () => {
    const app = buildApp();
    await app.ready();

    const res = await request(app.server)
      .post("/sessions/sess_not_found/finalize")
      .send({});

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("SESSION_NOT_FOUND");

    await app.close();
  });
});
