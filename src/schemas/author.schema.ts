import { z } from "zod";

export const createAuthorSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  bio: z.string().max(2000).optional(),
  birthDate: z.coerce.date().optional(),
  photo: z.string().url().optional(),
});

export const updateAuthorSchema = createAuthorSchema.partial();

export type CreateAuthorInput = z.infer<typeof createAuthorSchema>;
export type UpdateAuthorInput = z.infer<typeof updateAuthorSchema>;
