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
- Set env vars: `OPENAI_API_KEY`, optional `OPENAI_MODEL`, optional `OPENAI_BASE_URL`
- Local server still works without keys (fallback policy path)
- Run smoke test with real model:
  - `cd backend`
  - `OPENAI_API_KEY=... npm run test:e2e-live`
