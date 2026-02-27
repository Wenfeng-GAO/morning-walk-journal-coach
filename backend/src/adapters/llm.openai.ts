import type { MorningNoteInput } from "../domain/markdown-composer";
import type { NextQuestion, NextQuestionType } from "../domain/question-policy";
import type { Session } from "../domain/session";

import type { LlmAdapter, LlmNextQuestionInput } from "./llm";

type ChatCompletionsBody = {
  model: string;
  messages: Array<{
    role: "system" | "user";
    content: string;
  }>;
};

type ChatCompletionsOutput = {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            type?: string;
            text?: string;
          }>;
    };
  }>;
};

function extractJsonCandidate(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed.startsWith("```") && trimmed.includes("{")) {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return trimmed.slice(start, end + 1);
    }
  }

  return trimmed;
}

function toQuestionType(value: unknown): NextQuestionType | null {
  if (value === "follow_up" || value === "main" || value === "finalize") {
    return value;
  }

  return null;
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(extractJsonCandidate(raw)) as T;
  } catch {
    return null;
  }
}

function sessionTranscriptToText(session: Session): string {
  return session.transcript
    .map((message, index) => `${index + 1}. ${message.role}: ${message.text}`)
    .join("\n");
}

export class OpenAiLlmAdapter implements LlmAdapter {
  constructor(
    private readonly options: {
      apiKey: string;
      model: string;
      baseUrl: string;
    }
  ) {}

  private baseUrl(): string {
    return this.options.baseUrl.replace(/\/+$/, "");
  }

  private extractMessageContent(data: ChatCompletionsOutput): string | null {
    const rawContent = data.choices?.[0]?.message?.content;

    if (typeof rawContent === "string") {
      return rawContent;
    }

    if (Array.isArray(rawContent)) {
      const joined = rawContent
        .map((item) => (typeof item.text === "string" ? item.text : ""))
        .join("")
        .trim();

      return joined.length > 0 ? joined : null;
    }

    return null;
  }

  private async createTextCompletion(prompt: string): Promise<string | null> {
    const body: ChatCompletionsBody = {
      model: this.options.model,
      messages: [
        {
          role: "system",
          content: "You are a strict JSON response assistant."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    };

    const res = await fetch(`${this.baseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error(`OpenAI-compatible chat completions failed with ${res.status}`);
    }

    const data = (await res.json()) as ChatCompletionsOutput;

    return this.extractMessageContent(data);
  }

  async nextQuestion(input: LlmNextQuestionInput): Promise<NextQuestion | null> {
    const prompt = [
      "你是晨记问答助手。",
      "基于当前会话上下文，输出下一条问题 JSON。",
      "必须只输出 JSON，不要输出解释。",
      "JSON schema:",
      '{"nextQuestion":"string","nextQuestionType":"follow_up|main|finalize"}',
      "",
      `Fallback next question: ${JSON.stringify(input.fallback)}`,
      `Latest user transcript: ${input.latestUserTranscript}`,
      "Session transcript:",
      sessionTranscriptToText(input.session)
    ].join("\n");

    const output = await this.createTextCompletion(prompt);

    if (!output) {
      return null;
    }

    const parsed = safeJsonParse<{ nextQuestion?: unknown; nextQuestionType?: unknown }>(
      output
    );

    if (!parsed || typeof parsed.nextQuestion !== "string") {
      return null;
    }

    const nextQuestionType = toQuestionType(parsed.nextQuestionType);

    if (!nextQuestionType) {
      return null;
    }

    return {
      nextQuestion: parsed.nextQuestion,
      nextQuestionType
    };
  }

  async summarizeToNoteInput(session: Session): Promise<MorningNoteInput | null> {
    const prompt = [
      "你是晨记总结助手。",
      "基于会话输出结构化 JSON，总结为 MorningNoteInput。",
      "必须只输出 JSON，不要输出解释。",
      "JSON schema:",
      '{"sleepAt":"HH:mm","wakeAt":"HH:mm","facts":["..."],"review":"...","top3":["...","...","..."]}',
      "Session transcript:",
      sessionTranscriptToText(session)
    ].join("\n");

    const output = await this.createTextCompletion(prompt);

    if (!output) {
      return null;
    }

    const parsed = safeJsonParse<{
      sleepAt?: unknown;
      wakeAt?: unknown;
      facts?: unknown;
      review?: unknown;
      top3?: unknown;
    }>(output);

    if (!parsed) {
      return null;
    }

    if (
      typeof parsed.sleepAt !== "string" ||
      typeof parsed.wakeAt !== "string" ||
      typeof parsed.review !== "string" ||
      !Array.isArray(parsed.facts) ||
      !Array.isArray(parsed.top3)
    ) {
      return null;
    }

    const facts = parsed.facts.filter((item): item is string => typeof item === "string");
    const top3 = parsed.top3.filter((item): item is string => typeof item === "string");

    if (top3.length === 0) {
      return null;
    }

    return {
      sleepAt: parsed.sleepAt,
      wakeAt: parsed.wakeAt,
      facts,
      review: parsed.review,
      top3: top3.slice(0, 3)
    };
  }
}
