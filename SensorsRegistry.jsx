import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from "fastify";

export function requestLogger(
  req: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) {
  req.log.info({ method: req.method, url: req.url, ip: req.ip }, "Request");
  done();
}
