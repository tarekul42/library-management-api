import pino from "pino";
import { getEnv } from './env.js';

let _logger: ReturnType<typeof pino> | null = null;

export function getLogger() {
  if (!_logger) {
    const env = getEnv();
    _logger = pino({
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport:
        env.NODE_ENV !== "production"
          ? {
              target: "pino-pretty",
              options: { colorize: true },
            }
          : undefined,
    });
  }
  return _logger;
}
