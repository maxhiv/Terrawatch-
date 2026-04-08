import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import ws from "@fastify/websocket";
import staticFiles from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { authRoutes }    from "./routes/auth.js";
import { feedRoutes }    from "./routes/feeds.js";
import { anomalyRoutes } from "./routes/anomalies.js";
import { stationRoutes } from "./routes/stations.js";
import { errorHandler }  from "./middleware/errorHandler.js";
import { prisma }        from "./lib/prisma.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function buildApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV === "development"
      ? { transport: { target: "pino-pretty", options: { colorize: true } } }
      : true,
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Security
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:", "*.vexceldata.com", "*.tile.openstreetmap.org"],
        connectSrc: ["'self'", "wss:", "ws:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
      },
    },
  });

  await app.register(cors, {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      /\.replit\.app$/,
      /\.replit\.dev$/,
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
    keyGenerator: (req) =>
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: "Too Many Requests",
      message: "Rate limit exceeded. Try again in 60 seconds.",
    }),
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    sign: { expiresIn: "15m" },
  });

  await app.register(ws);

  app.setErrorHandler(errorHandler);

  // Health check
  app.get("/health", async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", ts: new Date().toISOString(), version: "1.0.0" };
  });

  // API routes
  await app.register(authRoutes,    { prefix: "/api/v1/auth" });
  await app.register(feedRoutes,    { prefix: "/api/v1/feeds" });
  await app.register(anomalyRoutes, { prefix: "/api/v1/anomalies" });
  await app.register(stationRoutes, { prefix: "/api/v1/stations" });

  // WebSocket live feed
  app.get("/ws/live", { websocket: true }, (socket, req) => {
    const token = (req.query as any).token;
    try {
      app.jwt.verify(token);
      socket.send(JSON.stringify({ type: "connected", ts: Date.now() }));
      const interval = setInterval(() => {
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify({ type: "heartbeat", ts: Date.now() }));
        }
      }, 30_000);
      socket.on("close", () => clearInterval(interval));
    } catch {
      socket.close(1008, "Unauthorized");
    }
  });

  // Serve client build in production
  if (process.env.NODE_ENV === "production") {
    const clientDist = path.join(__dirname, "../../client/dist");
    await app.register(staticFiles, { root: clientDist, prefix: "/" });
    app.setNotFoundHandler(async (req, reply) => {
      return reply.sendFile("index.html");
    });
  }

  return app;
}
