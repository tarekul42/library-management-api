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

// pre-save middlwware: runs before saving a borrow record
borrowSchema.pre("save", function (next) {
  console.log(`About to save borrow record for book ID: ${this.book}`);
  next();
});

// post-save middleware: runs after saving a borrow record
borrowSchema.post("save", function (doc) {
  console.log(`Borrow record saved successfully for book ID: ${doc._id}`);
});

const Borrow = model<IBorrow>("Borrow", borrowSchema);

export default Borrow;
