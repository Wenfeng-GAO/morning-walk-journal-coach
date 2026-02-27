# Interactive Web Journal UI Design

- Date: 2026-02-27
- Status: Approved
- Scope: Add a web frontend for interactive conversation with backend and markdown output/copy before iPhone integration

## 1. Goal

Provide a browser-based UI so user can interact with the backend in a bidirectional conversation and generate a morning journal markdown when user explicitly ends the session.

## 2. Confirmed Product Decisions

1. Frontend architecture: React + Vite frontend project
2. Hosting mode: frontend build artifacts served by backend (single deployable service)
3. Conversation mode: bidirectional conversation (not fixed Q&A)
4. Session ending rule: user manually triggers end ("结束晨记")
5. Output: markdown preview + one-click copy

## 3. UX Flow

1. User opens web page
2. User enters `userId` and optional `templateVersion`, then clicks "开始晨记"
3. Backend returns `sessionId` and first assistant message
4. User and assistant continue free-form conversation (user can ask, clarify, supplement)
5. User clicks "结束晨记"
6. Frontend calls finalize API and renders markdown output
7. User copies markdown for Obsidian usage

## 4. Information Architecture

### 4.1 Session Panel
- Input: `userId`
- Input: `templateVersion` (default `daily-v1`)
- Button: `开始晨记`
- Session metadata: `sessionId`, current state

### 4.2 Conversation Panel
- Chat timeline (assistant/user messages)
- Message input box
- Action: `发送`
- Optional action: `重试上一条` when request fails
- Action: `结束晨记`

### 4.3 Result Panel
- Read-only markdown display
- Button: `复制 Markdown`
- Status indicators for finalize/copy success/failure

## 5. Frontend State Model

1. `idle`: before session started
2. `active`: conversation in progress
3. `sending`: waiting answer API response
4. `finalizing`: waiting finalize API response
5. `done`: markdown generated
6. `error`: latest request failed

Transitions:
- `idle -> active` on start success
- `active -> sending -> active` for each message turn
- `active -> finalizing -> done` on manual finalize
- any state -> `error` on request failure, with explicit retry path

## 6. Backend Integration Contract

Existing APIs remain primary contract:
1. `POST /sessions/start`
2. `POST /sessions/:sessionId/answer`
3. `POST /sessions/:sessionId/finalize`

Message semantics update at UI layer:
- `answer` endpoint will carry user message regardless of whether it's “answer” or “question”
- assistant response rendered as next conversational turn
- finalize only triggered by explicit user action

## 7. Build and Hosting Design

1. New directory: `frontend/` (Vite + React + TypeScript)
2. Production build output: `frontend/dist`
3. Backend serves static files from `frontend/dist`
4. Development mode:
   - frontend dev server runs on Vite port
   - API requests proxied to backend (`localhost:8787`)

## 8. Error Handling

1. Start fails: show blocking error and keep in `idle`
2. Send fails: preserve input draft and provide retry
3. Session not found/expired: prompt restart session
4. Finalize fails: stay in `active`, allow re-finalize
5. Copy fails: fallback guidance for manual copy

## 9. Testing Strategy

### 9.1 Frontend Unit Tests
1. state transitions (`idle/active/finalizing/done/error`)
2. message list rendering
3. copy button behavior (success/failure)

### 9.2 Frontend-Backend Integration Tests
1. start -> multi-turn send -> finalize happy path
2. manual finalize only (no auto finalize)
3. send failure retry path

### 9.3 End-to-End Acceptance
1. at least 10 free-form turns (includes user asking assistant back)
2. manual end successfully generates markdown
3. markdown includes core sections and is copyable

## 10. Non-goals

1. iPhone shortcut implementation in this phase
2. voice input pipeline in browser
3. production auth/rate limit/observability hardening

## 11. Success Criteria

1. Browser user can complete full session without CLI/API tools
2. Conversation supports mutual clarification and supplement
3. Final markdown can be copied in one click and used directly in morning notes workflow
