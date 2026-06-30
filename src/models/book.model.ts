import mongoose, { Schema, Document } from "mongoose";
import { GENRES, getMaxPublishedYear } from "../shared/constants";

export interface IBookDocument extends Document {
  title: string;
  author: mongoose.Types.ObjectId;
  genre: string;
  isbn: string;
  description?: string;
  coverImage?: string;
  pages?: number;
  publisher?: string;
  publishedYear?: number;
  copies: number;
  availableCopies: number;
  tags: string[];
  avgRating: number;
  reviewCount: number;
  shelfLocation?: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bookSchema = new Schema<IBookDocument>(
  {
    title: { type: String, required: true, trim: true },
    author: { type: Schema.Types.ObjectId, ref: "Author", required: true },
    genre: {
      type: String,
      required: true,
      enum: GENRES,
    },
    isbn: { type: String, required: true, unique: true, trim: true },
    description: { type: String, maxlength: 2000 },
    coverImage: { type: String },
    pages: { type: Number, min: 1 },
    publisher: { type: String, trim: true },
    publishedYear: { type: Number, min: 1000, max: getMaxPublishedYear() },
    copies: { type: Number, required: true, min: 0 },
    availableCopies: { type: Number, required: true, min: 0 },
    tags: [{ type: String, trim: true }],
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    shelfLocation: { type: String },
    available: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

bookSchema.index({ title: "text", description: "text", tags: "text" });
bookSchema.index({ genre: 1, available: 1 });
bookSchema.index({ isbn: 1 });
bookSchema.index({ avgRating: -1 });
bookSchema.index({ createdAt: -1 });

export const Book = mongoose.model<IBookDocument>("Book", bookSchema);
