import { serve, type ServerType } from "@hono/node-server";
import { v2 as cloudinary } from "cloudinary";
import app from "./app";
import { getEnv, logger } from "./config";
import { connectDatabase, disconnectDatabase } from "./utils/connection";
import { disconnectRedis } from "./utils/redis";
import { startWorkers, stopWorkers } from "./workers";

let server: ServerType | null = null;

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

  server = serve(
    { fetch: app.fetch, port: env.PORT },
    (info) => {
      logger.info(`API server running on http://localhost:${info.port}`);
    },
  );
}

async function shutdown() {
  logger.info("Shutting down gracefully...");
  if (server) {
    server.close();
  }
  await stopWorkers();
  await disconnectDatabase();
  await disconnectRedis();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

main().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});
