import type { Model, Document } from "mongoose";
import { NotFoundError } from "./errors";

export async function findByIdOrThrow<T extends Document>(
  model: Model<T>,
  id: string,
  message?: string,
): Promise<T> {
  const doc = await model.findById(id);
  if (!doc) throw new NotFoundError(message ?? `${model.modelName} not found`);
  return doc;
}
