import { Redis } from "ioredis";
import { getEnv } from "../config";

let client: Redis | null = null;
let connecting: Promise<void> | null = null;

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
  if (connecting) return connecting;
  const redis = getRedis();
  if (redis.status === "ready" || redis.status === "connecting") return;
  connecting = redis.connect();
  try {
    await connecting;
  } finally {
    connecting = null;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
