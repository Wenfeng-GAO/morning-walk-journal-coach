export type SessionStage = "facts" | "review" | "today_plan" | "done";

export type SessionMessage = {
  role: "assistant" | "user";
  text: string;
};

export type Session = {
  sessionId: string;
  userId: string;
  templateVersion: string;
  turnIndex: number;
  followUpCount: number;
  stage: SessionStage;
  transcript: SessionMessage[];
};

export const FIRST_QUESTION = "先从昨天开始：昨天最重要的两件事实和进展是什么？";
