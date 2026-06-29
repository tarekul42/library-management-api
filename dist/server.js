import { serve } from "@hono/node-server";
import app from "./app";
import { getEnv, logger } from "./config";
import { connectDatabase } from "./utils/connection";
import { startWorkers, stopWorkers } from "./workers";
async function main() {
    const env = getEnv();
    await connectDatabase(env.DATABASE_URL);
    await startWorkers();
    serve({ fetch: app.fetch, port: env.PORT }, (info) => {
        logger.info(`API server running on http://localhost:${info.port}`);
    });
}
process.on("SIGTERM", async () => {
    logger.info("SIGTERM received, shutting down...");
    await stopWorkers();
    process.exit(0);
});
process.on("SIGINT", async () => {
    logger.info("SIGINT received, shutting down...");
    await stopWorkers();
    process.exit(0);
});
main().catch((err) => {
    logger.error("Failed to start server:", err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map