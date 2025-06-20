import { model, Schema } from "mongoose";
import { IBook } from "./book.interface";

const bookSchema = new Schema<IBook>(
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

// pre-save hook to update the 'available' field field based on 'copies' data
bookSchema.pre("save", function (next) {
  if (this.copies === 0) {
    this.available = false;
  } else {
    this.available = true;
  }
  next();
});

// Add this pre-findOneAndUpdate hook
bookSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() as any;
  if (update && update.copies !== undefined) {
    update.available = update.copies === 0 ? false : true;
    this.setUpdate(update);
  }
  next();
});

const Book = model<IBook>("Book", bookSchema);

export default Book;
