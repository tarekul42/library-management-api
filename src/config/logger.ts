import pino from "pino";
import { getEnv } from "./env";

export function createLogger() {
  const env = getEnv();
  return pino({
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

export const logger = createLogger();
