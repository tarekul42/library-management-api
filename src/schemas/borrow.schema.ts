import { z } from "zod";

export const createBorrowSchema = z.object({
  book: z.string().min(1, "Book ID is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  dueDate: z.coerce.date({
    errorMap: () => ({ message: "Due date must be a valid date" }),
  }),
});

export const borrowQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(["active", "returned", "overdue"]).optional(),
  userId: z.string().optional(),
});

export type CreateBorrowInput = z.infer<typeof createBorrowSchema>;
export type BorrowQuery = z.infer<typeof borrowQuerySchema>;
