import mongoose, { Schema, Document } from "mongoose";

export interface IBorrowDocument extends Document {
  user: mongoose.Types.ObjectId;
  book: mongoose.Types.ObjectId;
  quantity: number;
  borrowedAt: Date;
  dueDate: Date;
  returnedAt?: Date;
  status: "active" | "returned" | "overdue";
  fine?: mongoose.Types.ObjectId;
  renewalCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const borrowSchema = new Schema<IBorrowDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    quantity: { type: Number, required: true, min: 1 },
    borrowedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnedAt: { type: Date },
    status: {
      type: String,
      enum: ["active", "returned", "overdue"],
      default: "active",
    },
    fine: { type: Schema.Types.ObjectId, ref: "Fine", index: true },
    renewalCount: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

borrowSchema.index({ user: 1, status: 1 });
borrowSchema.index({ book: 1, status: 1 });
borrowSchema.index({ dueDate: 1, status: 1 });
borrowSchema.index({ borrowedAt: 1 });

export const Borrow = mongoose.model<IBorrowDocument>("Borrow", borrowSchema);
