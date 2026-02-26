import type { MorningNoteInput } from "../domain/markdown-composer";
import type { NextQuestion } from "../domain/question-policy";
import type { Session } from "../domain/session";

import type { LlmAdapter, LlmNextQuestionInput } from "./llm";

export class MockLlmAdapter implements LlmAdapter {
  async nextQuestion(input: LlmNextQuestionInput): Promise<NextQuestion | null> {
    return input.fallback;
  }

  async summarizeToNoteInput(_session: Session): Promise<MorningNoteInput | null> {
    return null;
  }
}
