# Morning Walk Journal Coach Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an iPhone-first, cloud-backed voice Q&A flow that outputs Obsidian-ready morning note Markdown and supports one-tap manual import.

**Architecture:** Use a TypeScript Node backend with a session state machine (`startSession` + `answerTurn`), pluggable STT/LLM adapters, and deterministic markdown composition aligned with the Daily Note Template. Keep integrations behind interfaces so MVP can run with mocked providers in tests. Expose a small HTTP API consumed by iOS Shortcuts.

**Tech Stack:** Node.js 22, TypeScript 5, Fastify 5, Zod, Vitest, Supertest, OpenAI API (STT + chat), npm.

---

### Task 1: Bootstrap service skeleton and test harness

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/vitest.config.ts`
- Create: `backend/src/app.ts`
- Create: `backend/src/server.ts`
- Create: `backend/tests/health.test.ts`

**Step 1: Write the failing test**

```ts
import request from "supertest";
import { buildApp } from "../src/app";

describe("health", () => {
  it("returns ok", async () => {
    const app = buildApp();
    const res = await request(app.server).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- --run tests/health.test.ts`
Expected: FAIL with module/file missing errors

**Step 3: Write minimal implementation**

```ts
// src/app.ts
import Fastify from "fastify";

export function buildApp() {
  const app = Fastify();
  app.get("/health", async () => ({ status: "ok" }));
  return app;
}
```

```ts
// src/server.ts
import { buildApp } from "./app";

const app = buildApp();
app.listen({ port: 8787, host: "0.0.0.0" });
```

**Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- --run tests/health.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/package.json backend/tsconfig.json backend/vitest.config.ts backend/src/app.ts backend/src/server.ts backend/tests/health.test.ts
git commit -m "chore: bootstrap backend skeleton with health test"
```

### Task 2: Add session domain model and `startSession`

**Files:**
- Create: `backend/src/domain/session.ts`
- Create: `backend/src/store/in-memory-session-store.ts`
- Create: `backend/src/routes/session-routes.ts`
- Modify: `backend/src/app.ts`
- Test: `backend/tests/start-session.test.ts`

**Step 1: Write the failing test**

```ts
it("creates a session and returns first question", async () => {
  const app = buildApp();
  const res = await request(app.server).post("/sessions/start").send({
    userId: "u-1",
    templateVersion: "daily-v1"
  });

  expect(res.status).toBe(200);
  expect(res.body.sessionId).toMatch(/^sess_/);
  expect(res.body.question).toContain("昨天");
  expect(res.body.turnIndex).toBe(0);
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- --run tests/start-session.test.ts`
Expected: FAIL with 404 `/sessions/start`

**Step 3: Write minimal implementation**

```ts
export type Session = {
  sessionId: string;
  userId: string;
  turnIndex: number;
  stage: "facts" | "review" | "today_plan" | "done";
  transcript: Array<{ role: "assistant" | "user"; text: string }>;
};

export const FIRST_QUESTION = "先从昨天开始：昨天最重要的两件事实和进展是什么？";
```

Implement route:
- `POST /sessions/start`
- create `sessionId = "sess_" + crypto.randomUUID().slice(0, 8)`
- persist into in-memory store
- return `{ sessionId, question: FIRST_QUESTION, turnIndex: 0 }`

**Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- --run tests/start-session.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/domain/session.ts backend/src/store/in-memory-session-store.ts backend/src/routes/session-routes.ts backend/src/app.ts backend/tests/start-session.test.ts
git commit -m "feat: add session start endpoint with in-memory store"
```

### Task 3: Add `answerTurn` endpoint with deterministic follow-up depth

**Files:**
- Create: `backend/src/domain/question-policy.ts`
- Modify: `backend/src/routes/session-routes.ts`
- Test: `backend/tests/answer-turn-followup.test.ts`

**Step 1: Write the failing test**

```ts
it("limits follow-up depth to 2 and then advances stage", async () => {
  const app = buildApp();
  const start = await request(app.server).post("/sessions/start").send({ userId: "u-1", templateVersion: "daily-v1" });
  const sessionId = start.body.sessionId;

  const t1 = await request(app.server).post(`/sessions/${sessionId}/answer`).send({ transcript: "我推进了 A 项目" });
  const t2 = await request(app.server).post(`/sessions/${sessionId}/answer`).send({ transcript: "证据是 PR merged" });
  const t3 = await request(app.server).post(`/sessions/${sessionId}/answer`).send({ transcript: "好的" });

  expect(t1.body.nextQuestionType).toBe("follow_up");
  expect(t2.body.nextQuestionType).toBe("follow_up");
  expect(t3.body.nextQuestionType).toBe("main");
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- --run tests/answer-turn-followup.test.ts`
Expected: FAIL with missing route/behavior

**Step 3: Write minimal implementation**

Add per-stage counters:
- `followUpCount` starts at `0`
- if `< 2`, return follow-up question and increment
- if `>= 2`, reset counter, advance stage

Return shape:

```json
{ "nextQuestion": "...", "nextQuestionType": "follow_up|main|finalize", "turnIndex": 1 }
```

**Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- --run tests/answer-turn-followup.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/domain/question-policy.ts backend/src/routes/session-routes.ts backend/tests/answer-turn-followup.test.ts
git commit -m "feat: add answer turn flow with bounded follow-up depth"
```

### Task 4: Add STT adapter interface and mocked default implementation

**Files:**
- Create: `backend/src/adapters/stt.ts`
- Create: `backend/src/adapters/stt.mock.ts`
- Modify: `backend/src/routes/session-routes.ts`
- Test: `backend/tests/answer-audio.test.ts`

**Step 1: Write the failing test**

```ts
it("accepts audioUrl payload and uses stt adapter", async () => {
  const app = buildApp();
  const start = await request(app.server).post("/sessions/start").send({ userId: "u-1", templateVersion: "daily-v1" });
  const res = await request(app.server)
    .post(`/sessions/${start.body.sessionId}/answer`)
    .send({ audioUrl: "https://example.com/a.m4a" });

  expect(res.status).toBe(200);
  expect(res.body.usedInputType).toBe("audio");
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- --run tests/answer-audio.test.ts`
Expected: FAIL because `audioUrl` path unsupported

**Step 3: Write minimal implementation**

```ts
export interface SttAdapter {
  transcribeAudioUrl(audioUrl: string): Promise<string>;
}

export class MockSttAdapter implements SttAdapter {
  async transcribeAudioUrl(): Promise<string> {
    return "mock transcript from audio";
  }
}
```

Route behavior:
- prefer `transcript` when present
- else if `audioUrl`, call STT adapter
- else return 400

**Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- --run tests/answer-audio.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/adapters/stt.ts backend/src/adapters/stt.mock.ts backend/src/routes/session-routes.ts backend/tests/answer-audio.test.ts
git commit -m "feat: support audio answer via stt adapter interface"
```

### Task 5: Compose Obsidian-aligned markdown from session transcript

**Files:**
- Create: `backend/src/domain/markdown-composer.ts`
- Create: `backend/src/prompts/daily-note-sections.ts`
- Test: `backend/tests/markdown-composer.test.ts`

**Step 1: Write the failing test**

```ts
it("renders required sections for daily note", () => {
  const markdown = composeMorningNote({
    sleepAt: "22:30",
    wakeAt: "06:45",
    facts: ["[事业] 事实：推进A；进展：合并PR；证据：链接"],
    review: "做对了拆分任务",
    top3: ["完成需求文档", "完成代码评审", "30分钟有氧"],
  });

  expect(markdown).toContain("## 昨天的事实与进展（客观 + 证据）");
  expect(markdown).toContain("## 今天最重要的 3 件事（结果导向）");
  expect(markdown).toContain("## 晚间复盘");
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- --run tests/markdown-composer.test.ts`
Expected: FAIL with missing composer

**Step 3: Write minimal implementation**

Implement `composeMorningNote(input)` that outputs:
- frontmatter with sleep/wake placeholders
- sections matching template titles verbatim
- bullet/task format for Top 3

**Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- --run tests/markdown-composer.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/domain/markdown-composer.ts backend/src/prompts/daily-note-sections.ts backend/tests/markdown-composer.test.ts
git commit -m "feat: add markdown composer aligned to daily note template"
```

### Task 6: Add finalize endpoint and error handling contract

**Files:**
- Modify: `backend/src/routes/session-routes.ts`
- Create: `backend/src/http/errors.ts`
- Test: `backend/tests/finalize-session.test.ts`
- Test: `backend/tests/error-contract.test.ts`

**Step 1: Write the failing test**

```ts
it("returns final markdown after dialogue completes", async () => {
  const app = buildApp();
  const start = await request(app.server).post("/sessions/start").send({ userId: "u-1", templateVersion: "daily-v1" });

  await completeSession(app, start.body.sessionId); // helper for test-only fast progression

  const res = await request(app.server).post(`/sessions/${start.body.sessionId}/finalize`).send({});
  expect(res.status).toBe(200);
  expect(res.body.markdown).toContain("## 今天最重要的 3 件事（结果导向）");
});
```

```ts
it("returns 404 for unknown session", async () => {
  const app = buildApp();
  const res = await request(app.server).post("/sessions/sess_not_found/finalize").send({});
  expect(res.status).toBe(404);
  expect(res.body.error.code).toBe("SESSION_NOT_FOUND");
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- --run tests/finalize-session.test.ts tests/error-contract.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

- add `POST /sessions/:sessionId/finalize`
- validate state is complete; else return `409 SESSION_NOT_COMPLETE`
- unified error body:

```json
{ "error": { "code": "SESSION_NOT_FOUND", "message": "Session does not exist" } }
```

**Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- --run tests/finalize-session.test.ts tests/error-contract.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/routes/session-routes.ts backend/src/http/errors.ts backend/tests/finalize-session.test.ts backend/tests/error-contract.test.ts
git commit -m "feat: add finalize endpoint with stable error contract"
```

### Task 7: Document iOS Shortcut integration contract

**Files:**
- Create: `docs/integration/ios-shortcut-contract.md`
- Create: `docs/integration/sample-shortcut-payloads.json`
- Modify: `README.md`

**Step 1: Write the failing doc check**

```bash
cd backend && npm run lint:docs
```

Expected: FAIL because integration docs are missing

**Step 2: Write minimal documentation**

Document:
- `startSession` request/response
- `answerTurn` text and audio examples
- `finalize` response payload
- one-tap manual import flow for Obsidian Sync users

Sample JSON must include:

```json
{
  "startSession": { "userId": "u-1", "templateVersion": "daily-v1" },
  "answerTurnAudio": { "audioUrl": "https://..." }
}
```

**Step 3: Run doc check**

Run: `cd backend && npm run lint:docs`
Expected: PASS

**Step 4: Commit**

```bash
git add docs/integration/ios-shortcut-contract.md docs/integration/sample-shortcut-payloads.json README.md
git commit -m "docs: add ios shortcut integration contract for mvp"
```

### Task 8: Verify end-to-end happy path with test-only mock adapters

**Files:**
- Create: `backend/tests/e2e-happy-path.test.ts`
- Modify: `backend/src/app.ts`

**Step 1: Write the failing E2E test**

```ts
it("completes full morning flow and returns markdown in 1 session", async () => {
  const app = buildApp({ useMockAdapters: true });
  const start = await request(app.server).post("/sessions/start").send({ userId: "u-1", templateVersion: "daily-v1" });

  const sessionId = start.body.sessionId;
  await answerMinimalTurns(app, sessionId);

  const done = await request(app.server).post(`/sessions/${sessionId}/finalize`).send({});
  expect(done.status).toBe(200);
  expect(done.body.markdown).toContain("## 昨天关键复盘（做对/做错/防错）");
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- --run tests/e2e-happy-path.test.ts`
Expected: FAIL with missing wiring

**Step 3: Write minimal implementation**

- add `buildApp({ useMockAdapters })` option
- wire mock STT + deterministic dialogue policy in tests
- ensure full loop can close without external API keys

**Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- --run tests/e2e-happy-path.test.ts`
Expected: PASS

**Step 5: Full verification + commit**

Run:

```bash
cd backend && npm test
```

Expected: PASS all tests

Then:

```bash
git add backend/tests/e2e-happy-path.test.ts backend/src/app.ts
git commit -m "test: add e2e happy path for morning journal mvp"
```

## Implementation notes

- Keep MVP strict: iPhone only, no Apple Watch/Mac scope creep.
- Follow `@test-driven-development` and `@verification-before-completion` for every task.
- Keep provider code behind interfaces so replacing OpenAI/STT implementation does not change route contracts.
- Do not add database in MVP; in-memory store is enough for single-session pilot.
