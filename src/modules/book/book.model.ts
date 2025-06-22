import { model, Schema, Model } from "mongoose";
import { IAvailability, IBook } from "./book.interface";

const bookSchema = new Schema<IBook, Model<IBook>, IAvailability>(
  {
    title: { type: String, trim: true, required: true },
    author: { type: String, trim: true, required: true },
    genre: {
      type: String,
      required: true,
      enum: [
        "FICTION",
        "NON_FICTION",
        "SCIENCE",
        "HISTORY",
        "BIOGRAPHY",
        "FANTASY",
      ],
    },
    isbn: { type: String, trim: true, required: true, unique: true },
    description: { type: String },
    copies: { type: Number, required: true, min: 0 },
    available: { type: Boolean, default: true },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

bookSchema.methods.updateAvailability = async function () {
  this.available = this.copies === 0 ? false : true;
  return this.save();
};

const Book = model<IBook, Model<IAvailability>>("Book", bookSchema);

export default Book;
