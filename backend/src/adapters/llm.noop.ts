import type { MorningNoteInput } from "../domain/markdown-composer";
import type { NextQuestion } from "../domain/question-policy";
import type { Session } from "../domain/session";

import type { LlmAdapter, LlmNextQuestionInput } from "./llm";

export class NoopLlmAdapter implements LlmAdapter {
  async nextQuestion(_input: LlmNextQuestionInput): Promise<NextQuestion | null> {
    return null;
  }

  async summarizeToNoteInput(_session: Session): Promise<MorningNoteInput | null> {
    return null;
  }
}
