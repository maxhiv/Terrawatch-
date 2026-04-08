import { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import pino from "pino";

const log = pino({ name: "ErrorHandler" });

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export async function errorHandler(
  error: FastifyError | AppError | Error,
  req: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: error.name,
      message: error.message,
      ...(error.code ? { code: error.code } : {}),
    });
  }

  // Fastify validation errors
  if ((error as FastifyError).statusCode === 400 && (error as any).validation) {
    return reply.status(400).send({
      statusCode: 400,
      error: "Validation Error",
      message: "Request validation failed",
      details: (error as any).validation,
    });
  }

  // Prisma unique constraint
  if ((error as any).code === "P2002") {
    return reply.status(409).send({
      statusCode: 409,
      error: "Conflict",
      message: "A record with this value already exists",
    });
  }

  log.error({ err: error, req: { method: req.method, url: req.url } }, "Unhandled error");

  return reply.status(500).send({
    statusCode: 500,
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : error.message,
  });
}
