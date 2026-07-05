import type { Model, PopulateOptions } from "mongoose";
import type { IPaginatedResult } from "./types.js";

async function paginate<T>(
  model: Model<T>,
  filter: Record<string, unknown>,
  options: { page?: number; limit?: number; sort?: Record<string, 1 | -1> },
  populate?: string | PopulateOptions | (string | PopulateOptions)[],
  select?: string,
): Promise<IPaginatedResult<T>> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 10));
  const skip = (page - 1) * limit;

  let query = model.find(filter).sort(options.sort || { createdAt: -1 }).skip(skip).limit(limit);
  if (select) query = query.select(select);
  if (populate) query = query.populate(populate as PopulateOptions | (string | PopulateOptions)[]);

  const [data, total] = await Promise.all([
    query,
    model.countDocuments(filter),
  ]);

  return { data: data as T[], meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export { paginate };
