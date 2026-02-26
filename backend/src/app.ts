import Fastify from "fastify";

import { registerSessionRoutes } from "./routes/session-routes";
import { InMemorySessionStore } from "./store/in-memory-session-store";

export function buildApp() {
  const app = Fastify();
  const sessionStore = new InMemorySessionStore();

  app.get("/health", async () => ({ status: "ok" }));
  registerSessionRoutes(app, sessionStore);

  return app;
}
