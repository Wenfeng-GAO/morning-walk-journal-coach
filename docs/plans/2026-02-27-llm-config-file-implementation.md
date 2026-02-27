# LLM Config File Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add config-file-first LLM provider/model/key loading so backend startup uses one active provider from local file.

**Architecture:** Introduce a dedicated config loader module that reads `backend/config/llm.local.json`, validates schema with Zod, and returns one resolved provider config. Wire `buildApp` to use this resolved config for `OpenAiLlmAdapter` construction, keeping explicit test adapter injection unchanged. Keep fallback behavior in routes unchanged (LLM failure -> deterministic policy fallback).

**Tech Stack:** Node.js, TypeScript, Fastify, Zod, Vitest, Supertest.

---

### Task 1: Add config loader failing tests

**Files:**
- Create: `backend/tests/llm-config.test.ts`
- Create: `backend/tests/fixtures/llm-config.valid.json`
- Create: `backend/tests/fixtures/llm-config.invalid.json`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { loadLlmConfigFromFile } from "../src/config/llm-config";

it("loads valid llm config", () => {
  const config = loadLlmConfigFromFile("tests/fixtures/llm-config.valid.json");
  expect(config.activeProvider).toBe("moonshot");
  expect(config.resolved.model).toBe("kimi-k2.5");
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- --run tests/llm-config.test.ts`
Expected: FAIL with module not found (`../src/config/llm-config`)

**Step 3: Write fixture files only**

```json
// tests/fixtures/llm-config.valid.json
{
  "active_provider": "moonshot",
  "providers": {
    "moonshot": {
      "model": "kimi-k2.5",
      "api_key": "msk-test",
      "base_url": "https://api.moonshot.cn/v1"
    }
  }
}
```

**Step 4: Run test (still expected fail)**

Run: `cd backend && npm test -- --run tests/llm-config.test.ts`
Expected: FAIL with missing implementation module

**Step 5: Commit**

```bash
git add backend/tests/llm-config.test.ts backend/tests/fixtures/llm-config.valid.json backend/tests/fixtures/llm-config.invalid.json
git commit -m "test: add failing tests for llm config loader"
```

### Task 2: Implement config loader and validation

**Files:**
- Create: `backend/src/config/llm-config.ts`
- Modify: `backend/tests/llm-config.test.ts`

**Step 1: Expand tests for failures**

```ts
it("throws when file does not exist", () => {
  expect(() => loadLlmConfigFromFile("tests/fixtures/not-exist.json")).toThrow(/not found/i);
});

it("throws when active provider is missing", () => {
  expect(() => loadLlmConfigFromFile("tests/fixtures/llm-config.invalid.json")).toThrow(/active_provider/i);
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- --run tests/llm-config.test.ts`
Expected: FAIL due missing behavior

**Step 3: Write minimal implementation**

```ts
const schema = z.object({
  active_provider: z.string().min(1),
  providers: z.record(z.object({
    model: z.string().min(1),
    api_key: z.string().min(1),
    base_url: z.string().url()
  }))
});

export function loadLlmConfigFromFile(pathLike: string): ResolvedLlmConfig {
  // read file -> parse json -> schema.parse -> verify active provider exists
}
```

**Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- --run tests/llm-config.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/config/llm-config.ts backend/tests/llm-config.test.ts
git commit -m "feat: implement validated llm config loader"
```

### Task 3: Wire app startup to config file

**Files:**
- Modify: `backend/src/app.ts`
- Modify: `backend/tests/kimi-openai-compat.test.ts`
- Create: `backend/tests/app-config-integration.test.ts`

**Step 1: Write the failing integration test**

```ts
it("buildApp(openai mode) uses llm.local.json when no adapter override", async () => {
  const app = buildApp({ llmMode: "openai", llmConfigPath: "tests/fixtures/llm-config.valid.json" });
  // assert outbound fetch uses moonshot base_url/model from file
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- --run tests/app-config-integration.test.ts`
Expected: FAIL (unknown option or env fallback still used)

**Step 3: Write minimal implementation**

```ts
export type BuildAppOptions = {
  llmConfigPath?: string;
  // existing fields
};

const configPath = options.llmConfigPath ?? "config/llm.local.json";
const llmConfig = loadLlmConfigFromFile(configPath);
return new OpenAiLlmAdapter({
  apiKey: llmConfig.resolved.apiKey,
  model: llmConfig.resolved.model,
  baseUrl: llmConfig.resolved.baseUrl
});
```

Keep `options.llmAdapter` override as first priority for tests.

**Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- --run tests/app-config-integration.test.ts tests/kimi-openai-compat.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/app.ts backend/tests/app-config-integration.test.ts backend/tests/kimi-openai-compat.test.ts
git commit -m "feat: load active llm provider from config file in app startup"
```

### Task 4: Add example/local config files and repo safety

**Files:**
- Create: `backend/config/llm.example.json`
- Modify: `.gitignore`
- Create (local only, not committed): `backend/config/llm.local.json`

**Step 1: Write safety test/check (failing first)**

Run: `cd backend && test -f config/llm.example.json`
Expected: FAIL before file exists

**Step 2: Add minimal files**

```json
// backend/config/llm.example.json
{
  "active_provider": "moonshot",
  "providers": {
    "moonshot": {
      "model": "kimi-k2.5",
      "api_key": "replace-with-your-key",
      "base_url": "https://api.moonshot.cn/v1"
    }
  }
}
```

Add to `.gitignore`:

```gitignore
backend/config/llm.local.json
```

**Step 3: Run check to verify it passes**

Run: `cd backend && test -f config/llm.example.json && echo ok`
Expected: `ok`

**Step 4: Commit**

```bash
git add backend/config/llm.example.json .gitignore
git commit -m "docs: add llm example config and ignore local secrets file"
```

### Task 5: Update live smoke test to use config-file key

**Files:**
- Modify: `backend/tests/e2e-live-openai.test.ts`

**Step 1: Write the failing test expectation**

Add expectation:

```ts
expect(() => loadLlmConfigFromFile("config/llm.local.json")).not.toThrow();
```

(or skip live test when config missing)

**Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- --run tests/e2e-live-openai.test.ts`
Expected: FAIL or wrong skip behavior

**Step 3: Write minimal implementation**

- live test reads config file for active provider/key/model/base_url
- keep gating with `RUN_LIVE_E2E=1`
- if file missing, skip with explicit reason

**Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- --run tests/e2e-live-openai.test.ts`
Expected: PASS (usually skipped locally)

**Step 5: Commit**

```bash
git add backend/tests/e2e-live-openai.test.ts
git commit -m "test: make live e2e read llm config file"
```

### Task 6: Final verification and docs update

**Files:**
- Modify: `README.md`
- Modify: `docs/integration/ios-shortcut-contract.md` (if startup config section needed)

**Step 1: Update docs**

Document exact setup:

```bash
cp backend/config/llm.example.json backend/config/llm.local.json
# edit api_key
cd backend && npm test
RUN_LIVE_E2E=1 npm run test:e2e-live
```

**Step 2: Run full verification**

Run:

```bash
cd backend && npm run lint:docs && npm test
```

Expected: PASS with live test skipped unless explicitly enabled

**Step 3: Commit**

```bash
git add README.md docs/integration/ios-shortcut-contract.md
git commit -m "docs: add config-file setup for llm provider and api key"
```

## Implementation notes

- Follow @test-driven-development strictly for each task (red -> green -> refactor).
- Use @verification-before-completion before each claim/commit.
- Keep adapter injection (`llmAdapter` override) for deterministic tests.
- Keep fallback path in routes unchanged so LLM outages do not break main flow.
