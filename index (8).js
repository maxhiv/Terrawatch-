import { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { cache } from "../lib/cache.js";

export const feedRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", authMiddleware);

  app.get("/", async () => {
    const cacheKey = "feeds:all";
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    const feeds = await prisma.feed.findMany({ orderBy: { category: "asc" } });
    cache.set(cacheKey, feeds, 300);
    return feeds;
  });

  app.get("/:id/readings", async (req) => {
    const { id } = req.params as any;
    const q = req.query as any;
    const hours = Math.min(168, parseInt(q.hours || "24"));
    const since = new Date(Date.now() - hours * 3600_000);
    const cacheKey = `readings:${id}:${hours}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const readings = await prisma.reading.findMany({
      where: { feedId: id, recordedAt: { gte: since }, quality: { gte: 0 } },
      orderBy: { recordedAt: "asc" },
      select: { parameter: true, value: true, unit: true, recordedAt: true },
    });
    cache.set(cacheKey, readings, 60);
    return readings;
  });
};
