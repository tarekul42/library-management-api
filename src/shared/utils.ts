import mongoose, { type Model, type Document } from "mongoose";
import { AppError, NotFoundError } from "./errors";

export function validateObjectId(id: string, label: string = "ID"): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}: "${id}"`, 400);
  }
}

export async function findByIdOrThrow<T extends Document>(
  model: Model<T>,
  id: string,
  message?: string,
): Promise<T> {
  validateObjectId(id, `${model.modelName} ID`);
  const doc = await model.findById(id);
  if (!doc) throw new NotFoundError(message ?? `${model.modelName} not found`);
  return doc;
}
