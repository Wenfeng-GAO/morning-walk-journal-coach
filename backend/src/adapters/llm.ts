import type { MorningNoteInput } from "../domain/markdown-composer";
import type { NextQuestion } from "../domain/question-policy";
import type { Session } from "../domain/session";

export type LlmNextQuestionInput = {
  session: Session;
  latestUserTranscript: string;
  fallback: NextQuestion;
};

export interface LlmAdapter {
  nextQuestion(input: LlmNextQuestionInput): Promise<NextQuestion | null>;
  summarizeToNoteInput(session: Session): Promise<MorningNoteInput | null>;
}
