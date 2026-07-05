import { Redis } from "ioredis";
import { getEnv, getLogger } from '../config/index.js';

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
  if (redis.status === "ready") return;
  if (redis.status === "connecting" || redis.status === "connect") {
    connecting = new Promise<void>((resolve) => {
      redis.once("ready", resolve);
    });
  } else {
    connecting = redis.connect();
  }
  try {
    await connecting;
  } catch (err) {
    getLogger().warn({ err }, "Redis unavailable — continuing without cache");
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
