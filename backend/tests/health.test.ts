import request from "supertest";
import { describe, expect, it } from "vitest";

import { buildApp } from "../src/app";

describe("health", () => {
  it("returns ok", async () => {
    const app = buildApp();
    await app.ready();

    const res = await request(app.server).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });

    await app.close();
  });
});
