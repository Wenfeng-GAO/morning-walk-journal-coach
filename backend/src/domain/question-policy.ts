import type { Session, SessionStage } from "./session";

export type NextQuestionType = "follow_up" | "main" | "finalize";

export type NextQuestion = {
  nextQuestion: string;
  nextQuestionType: NextQuestionType;
};

const FOLLOW_UP_LIMIT = 2;

function advanceStage(stage: SessionStage): SessionStage {
  if (stage === "facts") {
    return "review";
  }

  if (stage === "review") {
    return "today_plan";
  }

  if (stage === "today_plan") {
    return "done";
  }

  return "done";
}

function mainQuestionForStage(stage: SessionStage): string {
  if (stage === "facts") {
    return "继续补充：昨天还有哪些关键事实、进展和证据？";
  }

  if (stage === "review") {
    return "复盘一下：昨天做对了什么、做错了什么、今天怎么防止重犯？";
  }

  if (stage === "today_plan") {
    return "今天最重要的 3 件结果导向任务分别是什么？";
  }

  return "晨记对话完成，接下来我会为你整理 Markdown。";
}

function followUpQuestionForStage(stage: SessionStage, depth: number): string {
  if (stage === "facts") {
    return depth === 1
      ? "这件事的具体进展是什么？"
      : "这件事有什么可验证的证据？";
  }

  if (stage === "review") {
    return depth === 1
      ? "你认为背后的根因是什么？"
      : "今天最小可执行的防错动作是什么？";
  }

  return depth === 1
    ? "每件任务的完成标准是什么？"
    : "最晚完成时间分别是几点？";
}

export function computeNextQuestion(session: Session): NextQuestion {
  if (session.stage === "done") {
    return {
      nextQuestion: "晨记对话已结束，请调用 finalize 获取 Markdown。",
      nextQuestionType: "finalize"
    };
  }

  if (session.followUpCount < FOLLOW_UP_LIMIT) {
    session.followUpCount += 1;

    return {
      nextQuestion: followUpQuestionForStage(session.stage, session.followUpCount),
      nextQuestionType: "follow_up"
    };
  }

  session.followUpCount = 0;
  session.stage = advanceStage(session.stage);

  if (session.stage === "done") {
    return {
      nextQuestion: "问题收集完成，准备生成晨记。",
      nextQuestionType: "finalize"
    };
  }

  return {
    nextQuestion: mainQuestionForStage(session.stage),
    nextQuestionType: "main"
  };
}
