import { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { cache } from "../lib/cache.js";
import { AppError } from "../middleware/errorHandler.js";

export const anomalyRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", authMiddleware);

  app.get("/", async (req) => {
    const { orgId } = req.user as any;
    const q = req.query as any;
    const page     = Math.max(1, parseInt(q.page || "1"));
    const limit    = Math.min(50, parseInt(q.limit || "20"));
    const severity = q.severity;
    const since    = q.since ? new Date(q.since) : new Date(Date.now() - 30 * 86400_000);
    const resolved = q.resolved === "true";

    const where = {
      orgId,
      ...(severity ? { severity } : {}),
      resolvedAt: resolved ? { not: null } : null,
      occurredAt: { gte: since },
      falsePositive: false,
    };

    const [anomalies, total] = await prisma.$transaction([
      prisma.anomaly.findMany({
        where, orderBy: { occurredAt: "desc" },
        skip: (page - 1) * limit, take: limit,
        include: { station: { select: { id: true, name: true, code: true } } },
      }),
      prisma.anomaly.count({ where }),
    ]);
    return { anomalies, total, page, pages: Math.ceil(total / limit) };
  });

  app.get("/stats", async (req) => {
    const { orgId } = req.user as any;
    const cacheKey = `anomaly-stats:${orgId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const since = new Date(Date.now() - 24 * 3600_000);
    const [bySeverity, byParameter, active] = await prisma.$transaction([
      prisma.anomaly.groupBy({ by: ["severity"],
        where: { orgId, occurredAt: { gte: since }, falsePositive: false }, _count: { id: true } }),
      prisma.anomaly.groupBy({ by: ["parameter"],
        where: { orgId, occurredAt: { gte: since }, falsePositive: false }, _count: { id: true },
        orderBy: { _count: { id: "desc" } }, take: 5 }),
      prisma.anomaly.findMany({
        where: { orgId, resolvedAt: null, falsePositive: false },
        orderBy: [{ severity: "desc" }, { occurredAt: "desc" }], take: 5,
        include: { station: { select: { name: true } } },
      }),
    ]);

    const result = { bySeverity, byParameter, activeCount: active.length, active };
    cache.set(cacheKey, result, 120);
    return result;
  });

  app.patch("/:id/resolve", async (req) => {
    const { orgId } = req.user as any;
    const { id } = req.params as any;
    const anomaly = await prisma.anomaly.findFirst({ where: { id, orgId } });
    if (!anomaly) throw new AppError("Anomaly not found", 404);
    return prisma.anomaly.update({ where: { id }, data: { resolvedAt: new Date() } });
  });

  app.patch("/:id/false-positive", async (req) => {
    const { orgId } = req.user as any;
    const { id } = req.params as any;
    const anomaly = await prisma.anomaly.findFirst({ where: { id, orgId } });
    if (!anomaly) throw new AppError("Anomaly not found", 404);
    return prisma.anomaly.update({ where: { id }, data: { falsePositive: true, resolvedAt: new Date() } });
  });
};
