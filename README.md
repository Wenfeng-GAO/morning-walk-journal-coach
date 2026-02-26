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
- Preferred env vars for Kimi 2.5: `MOONSHOT_API_KEY`, optional `MOONSHOT_MODEL`, optional `MOONSHOT_BASE_URL`
- OpenAI-compatible aliases are also supported: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`
- Local server still works without keys (fallback policy path)
- Run smoke test with real model:
  - `cd backend`
  - `MOONSHOT_API_KEY=... npm run test:e2e-live`
