import mongoose from "mongoose";
import { logger } from "../config";

let isConnected = false;
let connecting: Promise<void> | null = null;

export async function connectDatabase(uri: string): Promise<void> {
  if (isConnected) return;
  if (connecting) { await connecting; return; }

  connecting = mongoose.connect(uri).then(() => {
    isConnected = true;
    logger.info("Database connected successfully");
  }).catch((error) => {
    isConnected = false;
    logger.error({ err: error }, "Database connection failed");
    throw error;
  }).finally(() => {
    connecting = null;
  });
  await connecting;

  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB connection error");
  });

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
  });
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}
