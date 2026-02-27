# LLM Config File Design

- Date: 2026-02-27
- Status: Approved
- Scope: Backend runtime model/provider selection and API key loading via local config file

## 1. Goal

Move LLM provider/model/api key configuration from environment-variable-first to config-file-first, with a single active provider at service startup.

## 2. Decision Summary

1. Configuration method: local file in backend workspace
2. Runtime selection mode: single active provider
3. Initial format: JSON
4. Security baseline: local secret file ignored by git + checked-in example file

## 3. File Layout

1. Local runtime config (required for local run):
   - `backend/config/llm.local.json`
2. Example config (checked in):
   - `backend/config/llm.example.json`

## 4. Config Schema

```json
{
  "active_provider": "moonshot",
  "providers": {
    "moonshot": {
      "model": "kimi-k2.5",
      "api_key": "msk-...",
      "base_url": "https://api.moonshot.cn/v1"
    },
    "openai": {
      "model": "gpt-4.1-mini",
      "api_key": "",
      "base_url": "https://api.openai.com/v1"
    }
  }
}
```

## 5. Runtime Loading Flow

1. Backend startup reads `backend/config/llm.local.json`
2. Validate schema and required fields
3. Ensure `active_provider` exists in `providers`
4. Resolve provider config from active provider entry
5. Build LLM adapter with resolved `api_key`, `model`, `base_url`
6. If file missing/invalid, startup fails fast with explicit error

## 6. Error Handling

1. Missing file: fail startup with `LLM config file not found`
2. Invalid JSON: fail startup with parse error and file path
3. Schema violation: fail startup with field path details
4. Missing active provider entry: fail startup with provider name
5. Empty `api_key`: fail startup with validation error

## 7. Security and Repo Hygiene

1. Add `backend/config/llm.local.json` to `.gitignore`
2. Keep `backend/config/llm.example.json` in repository
3. Do not log raw API keys

## 8. Testing Strategy

1. Unit tests for config loader:
   - valid config parses
   - missing file fails
   - malformed JSON fails
   - unknown active provider fails
2. Compatibility test:
   - verify active moonshot config drives `chat/completions` request
3. Live smoke (gated):
   - use local config API key
   - run only when `RUN_LIVE_E2E=1`

## 9. Minimal End-to-End Validation

1. Copy `llm.example.json` to `llm.local.json`
2. Fill `api_key` for moonshot and keep `active_provider=moonshot`
3. Start backend and run tests
4. Run gated live smoke test and assert start -> answer -> finalize path

## 10. Non-goals

1. Runtime per-request provider switching
2. Secret manager/keychain integration
3. Remote config distribution
