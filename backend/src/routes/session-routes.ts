import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { computeNextQuestion } from "../domain/question-policy";
import { FIRST_QUESTION, type Session } from "../domain/session";
import type { SessionStore } from "../store/in-memory-session-store";

const startSessionBodySchema = z.object({
  userId: z.string().min(1),
  templateVersion: z.string().min(1)
});

const answerTurnParamsSchema = z.object({
  sessionId: z.string().min(1)
});

const answerTurnBodySchema = z.object({
  transcript: z.string().min(1).optional()
});

export function registerSessionRoutes(app: FastifyInstance, store: SessionStore) {
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
      return reply.status(404).send({ message: "session not found" });
    }

    if (!body.transcript) {
      return reply.status(400).send({ message: "transcript is required" });
    }

    session.transcript.push({ role: "user", text: body.transcript });
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
      usedInputType: "text"
    });
  });
}
