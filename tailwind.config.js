import "dotenv/config";
import { buildApp } from "./app.js";
import { startFeedPoller } from "./services/feedPoller.js";
import { startAnomalyEngine } from "./services/anomalyEngine.js";
import pino from "pino";

const log = pino({ name: "Server" });
const PORT = parseInt(process.env.PORT || "3001");
const HOST = "0.0.0.0";

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: PORT, host: HOST });
    log.info(`🌊 TERRAWATCH API running on http://${HOST}:${PORT}`);
    log.info(`   Environment: ${process.env.NODE_ENV}`);
    log.info(`   DB: ${process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] || "not configured"}`);

    // Start background jobs
    startFeedPoller();
    startAnomalyEngine();
  } catch (err) {
    log.error(err, "Server startup failed");
    process.exit(1);
  }
}

main();
