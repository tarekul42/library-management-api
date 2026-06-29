import { Redis } from "ioredis";
import { getEnv } from "../config";

let client: Redis | null = null;

export function getRedis(): Redis {
  if (client) return client;
  const env = getEnv();
  client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
  });
  return client;
}

export async function connectRedis(): Promise<void> {
  const redis = getRedis();
  if (redis.status === "ready" || redis.status === "connecting") return;
  await redis.connect();
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
