import { serve } from "@hono/node-server";
import { v2 as cloudinary } from "cloudinary";
import app from "./app";
import { getEnv, logger } from "./config";
import { connectDatabase } from "./utils/connection";
import { startWorkers, stopWorkers } from "./workers";
async function main() {
    const env = getEnv();
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
        cloudinary.config({
            cloud_name: env.CLOUDINARY_CLOUD_NAME,
            api_key: env.CLOUDINARY_API_KEY,
            api_secret: env.CLOUDINARY_API_SECRET,
        });
        logger.info("Cloudinary configured");
    }
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