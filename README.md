# Morning Walk Journal Coach

An iPhone-first, voice-driven morning reflection assistant that guides structured Q&A and produces Obsidian-ready Markdown.

## MVP
- Entry: iOS Shortcut (`开始晨记`)
- Interaction: cloud speech + LLM follow-up questions
- Output: structured Markdown aligned with Daily Note Template
- Write-back: one-tap manual import into Obsidian (Obsidian Sync)

## Docs
- [Design](docs/plans/2026-02-26-morning-walk-journal-coach-design.md)
- [Implementation Plan](docs/plans/2026-02-26-morning-walk-journal-coach-implementation.md)
- [iOS Shortcut Contract](docs/integration/ios-shortcut-contract.md)
- [Sample Shortcut Payloads](docs/integration/sample-shortcut-payloads.json)

## LLM Integration (Minimal)
- Copy config template:
  - `cp backend/config/llm.example.json backend/config/llm.local.json`
- Edit `backend/config/llm.local.json`:
  - set `active_provider` (for Kimi use `moonshot`)
  - fill `providers.moonshot.api_key`
- Run backend tests:
  - `cd backend && npm test`
- Run live smoke test (requires local config file + network):
  - `cd backend && RUN_LIVE_E2E=1 npm run test:e2e-live`
