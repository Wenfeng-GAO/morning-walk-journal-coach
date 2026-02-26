import Fastify from "fastify";

import { MockSttAdapter } from "./adapters/stt.mock";
import { registerSessionRoutes } from "./routes/session-routes";
import { InMemorySessionStore } from "./store/in-memory-session-store";

export function buildApp() {
  const app = Fastify();
  const sessionStore = new InMemorySessionStore();
  const sttAdapter = new MockSttAdapter();

  app.get("/health", async () => ({ status: "ok" }));
  registerSessionRoutes(app, sessionStore, sttAdapter);

  return app;
}
