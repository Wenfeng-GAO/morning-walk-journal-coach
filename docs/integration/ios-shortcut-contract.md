# iOS Shortcut Integration Contract (MVP)

## Overview

This contract defines how iOS Shortcut talks to the backend during one morning session.

## 1) Start Session

- Method: `POST`
- URL: `/sessions/start`
- Request:

```json
{
  "userId": "u-1",
  "templateVersion": "daily-v1"
}
```

- Response:

```json
{
  "sessionId": "sess_ab12cd34",
  "question": "先从昨天开始：昨天最重要的两件事实和进展是什么？",
  "turnIndex": 0
}
```

## 2) Answer Turn (Text)

- Method: `POST`
- URL: `/sessions/:sessionId/answer`
- Request:

```json
{
  "transcript": "我昨天完成了需求拆分"
}
```

- Response:

```json
{
  "nextQuestion": "这件事的具体进展是什么？",
  "nextQuestionType": "follow_up",
  "turnIndex": 1,
  "usedInputType": "text"
}
```

## 3) Answer Turn (Audio)

- Method: `POST`
- URL: `/sessions/:sessionId/answer`
- Request:

```json
{
  "audioUrl": "https://example.com/a.m4a"
}
```

- Response:

```json
{
  "nextQuestion": "这件事的具体进展是什么？",
  "nextQuestionType": "follow_up",
  "turnIndex": 1,
  "usedInputType": "audio"
}
```

## 4) Finalize

- Method: `POST`
- URL: `/sessions/:sessionId/finalize`
- Request:

```json
{}
```

- Response:

```json
{
  "sessionId": "sess_ab12cd34",
  "markdown": "---\\n..."
}
```

## Obsidian Sync One-Tap Manual Import

1. Shortcut gets `markdown` from finalize.
2. Shortcut copies it to clipboard.
3. Shortcut opens Obsidian target daily note.
4. User performs one tap paste/import.
