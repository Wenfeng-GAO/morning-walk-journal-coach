# Interactive Web Journal UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a React-based web UI served by backend so users can run bidirectional morning conversation and manually finalize markdown for copy.

**Architecture:** Add a `frontend/` Vite+React app with a small state machine (`idle/active/sending/finalizing/done/error`) and an API client that calls existing backend session endpoints. Keep backend APIs unchanged for now; only add static serving for built frontend assets and fallback route for SPA. Conversation remains free-form and finalize is manual by explicit user action.

**Tech Stack:** React 18, Vite 5, TypeScript, Vitest, React Testing Library, Fastify 5, @fastify/static.

---

### Task 1: Scaffold frontend project and test baseline

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/styles.css`
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/App.test.tsx`

**Step 1: Write the failing test**

```ts
import { render, screen } from "@testing-library/react";
import App from "./App";

test("shows start session button", () => {
  render(<App />);
  expect(screen.getByRole("button", { name: /开始晨记/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run src/App.test.tsx`
Expected: FAIL with missing module/scripts before scaffold completes

**Step 3: Write minimal implementation**

Implement minimal `App.tsx` rendering:
- title
- `开始晨记` button

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run src/App.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/package.json frontend/tsconfig.json frontend/vite.config.ts frontend/index.html frontend/src/main.tsx frontend/src/App.tsx frontend/src/styles.css frontend/src/test/setup.ts frontend/src/App.test.tsx
git commit -m "chore: scaffold frontend app with test baseline"
```

### Task 2: Add API client and type contracts

**Files:**
- Create: `frontend/src/lib/types.ts`
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/api.test.ts`

**Step 1: Write the failing test**

```ts
import { startSession } from "./api";

test("startSession posts payload and returns response", async () => {
  // mock fetch and assert URL, method, body
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run src/lib/api.test.ts`
Expected: FAIL with missing functions/types

**Step 3: Write minimal implementation**

Implement:
- `startSession(payload)`
- `sendTurn(sessionId, payload)`
- `finalizeSession(sessionId)`
- shared error parser for non-2xx responses

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run src/lib/api.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/lib/api.ts frontend/src/lib/api.test.ts
git commit -m "feat: add frontend api client for session lifecycle"
```

### Task 3: Implement conversation state hook

**Files:**
- Create: `frontend/src/hooks/useMorningSession.ts`
- Create: `frontend/src/hooks/useMorningSession.test.ts`

**Step 1: Write the failing test**

```ts
test("transitions idle -> active after start and appends assistant message", async () => {
  // mock api.startSession
  // assert state and message timeline
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run src/hooks/useMorningSession.test.ts`
Expected: FAIL with missing hook

**Step 3: Write minimal implementation**

Hook responsibilities:
- manage states: `idle/active/sending/finalizing/done/error`
- track `sessionId`, `messages`, `markdown`, `lastError`
- methods: `start()`, `sendMessage()`, `finalize()`, `retryLast()`

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run src/hooks/useMorningSession.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/hooks/useMorningSession.ts frontend/src/hooks/useMorningSession.test.ts
git commit -m "feat: add conversation state hook with manual finalize flow"
```

### Task 4: Build UI sections for session, chat, and markdown result

**Files:**
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/components/SessionPanel.tsx`
- Create: `frontend/src/components/ChatPanel.tsx`
- Create: `frontend/src/components/ResultPanel.tsx`
- Create: `frontend/src/components/AppLayout.test.tsx`
- Modify: `frontend/src/styles.css`

**Step 1: Write the failing test**

```ts
test("shows chat timeline and finalize button after session starts", async () => {
  // render App with mocked hook state active
  // assert finalize button and timeline
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run src/components/AppLayout.test.tsx`
Expected: FAIL with missing components

**Step 3: Write minimal implementation**

Implement 3 panels:
- Session start controls
- Conversation timeline + input + send + end session
- Markdown preview + copy button

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run src/components/AppLayout.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/src/components/SessionPanel.tsx frontend/src/components/ChatPanel.tsx frontend/src/components/ResultPanel.tsx frontend/src/components/AppLayout.test.tsx frontend/src/styles.css
git commit -m "feat: implement interactive web ui panels for journal flow"
```

### Task 5: Add copy-to-clipboard and resilient error UI

**Files:**
- Modify: `frontend/src/components/ResultPanel.tsx`
- Modify: `frontend/src/components/ChatPanel.tsx`
- Create: `frontend/src/components/copy-and-error.test.tsx`

**Step 1: Write the failing test**

```ts
test("copy button writes markdown to clipboard and shows success", async () => {
  // mock navigator.clipboard.writeText
});

test("send failure keeps draft and shows retry action", async () => {
  // mock failed send
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run src/components/copy-and-error.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

- clipboard success/failure feedback
- error banner with retry
- preserve unsent draft on failures

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run src/components/copy-and-error.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/ResultPanel.tsx frontend/src/components/ChatPanel.tsx frontend/src/components/copy-and-error.test.tsx
git commit -m "feat: add copy markdown and retryable error handling"
```

### Task 6: Serve frontend build from backend

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/src/app.ts`
- Create: `backend/src/http/frontend-static.ts`
- Create: `backend/tests/frontend-static.test.ts`

**Step 1: Write the failing test**

```ts
test("serves index fallback for non-api route", async () => {
  // request / and /app path
  // expect html response when dist exists
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- --run tests/frontend-static.test.ts`
Expected: FAIL (static route not registered)

**Step 3: Write minimal implementation**

- add `@fastify/static`
- serve `frontend/dist`
- fallback non-API paths to `index.html`

**Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- --run tests/frontend-static.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/package.json backend/src/app.ts backend/src/http/frontend-static.ts backend/tests/frontend-static.test.ts
git commit -m "feat: serve built frontend assets from backend"
```

### Task 7: Add dev/build scripts for full-stack workflow

**Files:**
- Modify: `package.json` (repo root, create if needed)
- Modify: `README.md`
- Create: `scripts/dev-all.sh`

**Step 1: Write the failing check**

Run: `npm run dev:all`
Expected: FAIL before script exists

**Step 2: Add minimal workflow scripts**

- `dev:frontend`, `dev:backend`, `dev:all`
- `build:frontend`, `build:backend`, `build:all`

**Step 3: Verify scripts**

Run:
- `npm run build:all`
Expected: both frontend and backend builds succeed

**Step 4: Commit**

```bash
git add package.json scripts/dev-all.sh README.md
git commit -m "chore: add full-stack dev and build scripts"
```

### Task 8: Final verification and acceptance checks

**Files:**
- Modify: `docs/integration/ios-shortcut-contract.md` (add note that web UI exists for backend validation)

**Step 1: Run frontend tests**

Run: `cd frontend && npm test`
Expected: PASS

**Step 2: Run backend tests**

Run: `cd backend && npm test`
Expected: PASS

**Step 3: Build both**

Run: `npm run build:all`
Expected: PASS

**Step 4: Manual acceptance**

1. Open web page
2. Start session
3. Complete >=10 free-form turns
4. Manually click finalize
5. Copy markdown successfully

**Step 5: Commit**

```bash
git add docs/integration/ios-shortcut-contract.md
git commit -m "docs: add web ui validation flow before iphone integration"
```

## Implementation notes

- Use @test-driven-development for each task (test first, then implementation).
- Use @verification-before-completion before each completion claim.
- Keep existing backend session APIs unchanged in this phase.
- Keep finalize explicitly user-driven; do not auto-finalize by heuristic.
