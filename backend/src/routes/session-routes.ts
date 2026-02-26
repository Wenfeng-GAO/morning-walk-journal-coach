import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { SttAdapter } from "../adapters/stt";
import { composeMorningNote } from "../domain/markdown-composer";
import { computeNextQuestion } from "../domain/question-policy";
import { FIRST_QUESTION, type Session } from "../domain/session";
import { sendAppError } from "../http/errors";
import type { SessionStore } from "../store/in-memory-session-store";

const startSessionBodySchema = z.object({
  userId: z.string().min(1),
  templateVersion: z.string().min(1)
});

const answerTurnParamsSchema = z.object({
  sessionId: z.string().min(1)
});

const answerTurnBodySchema = z.object({
  transcript: z.string().min(1).optional(),
  audioUrl: z.string().url().optional()
});

const finalizeParamsSchema = z.object({
  sessionId: z.string().min(1)
});

function toMorningNoteInput(session: Session) {
  const userTurns = session.transcript
    .filter((message) => message.role === "user")
    .map((message) => message.text);

  const facts = userTurns.slice(0, 3);
  const review = userTurns.slice(3, 6).join("；");
  const top3 = userTurns.slice(6, 9);

  return {
    sleepAt: "22:30",
    wakeAt: "06:45",
    facts,
    review,
    top3
  };
}

export function registerSessionRoutes(
  app: FastifyInstance,
  store: SessionStore,
  sttAdapter: SttAdapter
) {
  app.post("/sessions/start", async (request, reply) => {
    const body = startSessionBodySchema.parse(request.body);

    const session: Session = {
      sessionId: `sess_${randomUUID().replace(/-/g, "").slice(0, 8)}`,
      userId: body.userId,
      templateVersion: body.templateVersion,
      turnIndex: 0,
      followUpCount: 0,
      stage: "facts",
      transcript: [{ role: "assistant", text: FIRST_QUESTION }]
    };

    store.create(session);

    return reply.send({
      sessionId: session.sessionId,
      question: FIRST_QUESTION,
      turnIndex: session.turnIndex
    });
  });

  app.post("/sessions/:sessionId/answer", async (request, reply) => {
    const params = answerTurnParamsSchema.parse(request.params);
    const body = answerTurnBodySchema.parse(request.body);

    const session = store.get(params.sessionId);

    if (!session) {
      return sendAppError(reply, 404, "SESSION_NOT_FOUND", "Session does not exist");
    }

    let transcript = body.transcript;
    let usedInputType: "text" | "audio" = "text";

    if (!transcript && body.audioUrl) {
      transcript = await sttAdapter.transcribeAudioUrl(body.audioUrl);
      usedInputType = "audio";
    }

    if (!transcript) {
      return sendAppError(
        reply,
        400,
        "INVALID_INPUT",
        "transcript or audioUrl is required"
      );
    }

    session.transcript.push({ role: "user", text: transcript });
    session.turnIndex += 1;

    const next = computeNextQuestion(session);

    if (next.nextQuestionType !== "finalize") {
      session.transcript.push({ role: "assistant", text: next.nextQuestion });
    }

    store.save(session);

    return reply.send({
      nextQuestion: next.nextQuestion,
      nextQuestionType: next.nextQuestionType,
      turnIndex: session.turnIndex,
      usedInputType
    });
  });

  app.post("/sessions/:sessionId/finalize", async (request, reply) => {
    const params = finalizeParamsSchema.parse(request.params);
    const session = store.get(params.sessionId);

    if (!session) {
      return sendAppError(reply, 404, "SESSION_NOT_FOUND", "Session does not exist");
    }

    if (session.stage !== "done") {
      return sendAppError(
        reply,
        409,
        "SESSION_NOT_COMPLETE",
        "Session is not complete"
      );
    }

    const markdown = composeMorningNote(toMorningNoteInput(session));

    return reply.send({
      sessionId: session.sessionId,
      markdown
    });
  });
}
