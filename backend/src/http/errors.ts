import type { FastifyReply } from "fastify";

export type AppErrorCode =
  | "SESSION_NOT_FOUND"
  | "SESSION_NOT_COMPLETE"
  | "INVALID_INPUT";

export function sendAppError(
  reply: FastifyReply,
  statusCode: number,
  code: AppErrorCode,
  message: string
) {
  return reply.status(statusCode).send({
    error: {
      code,
      message
    }
  });
}
