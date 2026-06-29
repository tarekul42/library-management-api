import mongoose, { Schema, Document } from "mongoose";

export interface IFineDocument extends Document {
  user: mongoose.Types.ObjectId;
  borrow: mongoose.Types.ObjectId;
  amount: number;
  reason: string;
  paid: boolean;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const fineSchema = new Schema<IFineDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    borrow: { type: Schema.Types.ObjectId, ref: "Borrow", required: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true },
    paid: { type: Boolean, default: false },
    paidAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

fineSchema.index({ user: 1, paid: 1 });
fineSchema.index({ borrow: 1 }, { unique: true });

export const Fine = mongoose.model<IFineDocument>("Fine", fineSchema);
