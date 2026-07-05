import { getRedis } from './redis.js';
import { getLogger } from '../config/index.js';

const CACHE_PREFIX = "cache:";

function buildKey(...segments: string[]): string {
  return `${CACHE_PREFIX}${segments.join(":")}`;
}

export async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number,
): Promise<T> {
  try {
    const redis = getRedis();
    const cached = await redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }
  } catch (err) {
    getLogger().warn({ err, cacheKey: key }, "Cache read failed — falling through to database");
  }

  const data = await fetchFn();

  try {
    const redis = getRedis();
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  } catch (err) {
    getLogger().warn({ err, cacheKey: key }, "Cache write failed — data served from database");
  }

  return data;
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const redis = getRedis();
    const keys: string[] = [];
    let cursor = "0";
    do {
      const [nextCursor, batch] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== "0");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    getLogger().warn({ err, pattern }, "Cache invalidation failed");
  }
}

export { buildKey };
