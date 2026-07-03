import { serve, type ServerType } from "@hono/node-server";
import { v2 as cloudinary } from "cloudinary";
import app from './app.js';
import { getEnv, getLogger } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './utils/connection.js';
import { disconnectRedis } from './utils/redis.js';
import { startWorkers, stopWorkers } from './workers/index.js';

let server: ServerType | null = null;

async function main() {
  const env = getEnv();

  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
    getLogger().info("Cloudinary configured");
  }

  await connectDatabase(env.DATABASE_URL);
  await startWorkers();

  server = serve(
    { fetch: app.fetch, port: env.PORT },
    (info) => {
      getLogger().info(`API server running on http://localhost:${info.port}`);
    },
  );
}

async function shutdown() {
  getLogger().info("Shutting down gracefully...");
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

process.on("uncaughtException", (err) => {
  getLogger().error({ err }, "Uncaught exception — shutting down");
  shutdown();
});

process.on("unhandledRejection", (reason) => {
  getLogger().error({ err: reason }, "Unhandled rejection — shutting down");
  shutdown();
});

main().catch((err) => {
  getLogger().error({ err }, "Failed to start server");
  process.exit(1);
});
