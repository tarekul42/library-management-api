import mongoose, { Schema, Document } from "mongoose";

export interface IWishlistDocument extends Document {
  user: mongoose.Types.ObjectId;
  book: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlistDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
  },
  { timestamps: true, versionKey: false },
);

wishlistSchema.index({ user: 1, book: 1 }, { unique: true });

export const Wishlist = mongoose.model<IWishlistDocument>("Wishlist", wishlistSchema);
