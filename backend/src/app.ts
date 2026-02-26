import Fastify from "fastify";

import { MockSttAdapter } from "./adapters/stt.mock";
import { NoopSttAdapter } from "./adapters/stt.noop";
import type { SttAdapter } from "./adapters/stt";
import { registerSessionRoutes } from "./routes/session-routes";
import { InMemorySessionStore } from "./store/in-memory-session-store";

export type BuildAppOptions = {
  useMockAdapters?: boolean;
};

export function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify();
  const sessionStore = new InMemorySessionStore();
  const sttAdapter: SttAdapter = options.useMockAdapters
    ? new MockSttAdapter()
    : new NoopSttAdapter();

  app.get("/health", async () => ({ status: "ok" }));
  registerSessionRoutes(app, sessionStore, sttAdapter);

  return app;
}
