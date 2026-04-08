import { FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "./errorHandler.js";

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch {
    throw new AppError("Unauthorized — invalid or expired token", 401);
  }
}

export function requireRole(roles: string | string[]) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return async function (req: FastifyRequest, reply: FastifyReply) {
    await authMiddleware(req, reply);
    const user = req.user as any;
    if (!allowed.includes(user.role)) {
      throw new AppError(`Forbidden — requires role: ${allowed.join(" or ")}`, 403);
    }
  };
}
