import { serve } from "@hono/node-server";
import app from "./app";
import { getEnv, logger } from "./config";
import { connectDatabase } from "./utils/connection";
async function main() {
    const env = getEnv();
    await connectDatabase(env.DATABASE_URL);
    serve({ fetch: app.fetch, port: env.PORT }, (info) => {
        logger.info(`API server running on http://localhost:${info.port}`);
    });
}
main().catch((err) => {
    logger.error("Failed to start server:", err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map