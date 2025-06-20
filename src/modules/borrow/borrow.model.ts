import { model, Schema } from "mongoose";
import { IBorrow } from "./borrow.interface";

const borrowSchema = new Schema<IBorrow>(
  {
    book: { type: Schema.Types.ObjectId },
    quantity: { type: Number, min: 1, required: true },
    dueDate: { type: Date, required: true },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const Borrow = model<IBorrow>("Borrow", borrowSchema);

export default Borrow;