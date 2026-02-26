import { buildApp } from "./app";

async function start() {
  const app = buildApp();
  await app.listen({ host: "0.0.0.0", port: 8787 });
}

start().catch((error) => {
  // Keep startup failure explicit for local runs.
  console.error(error);
  process.exit(1);
});
