import mongoose, { Schema, Document } from "mongoose";

export interface IReviewDocument extends Document {
  user: mongoose.Types.ObjectId;
  book: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReviewDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 2000 },
  },
  { timestamps: true, versionKey: false },
);

reviewSchema.index({ book: 1, user: 1 }, { unique: true });
reviewSchema.index({ book: 1, rating: -1 });

export const Review = mongoose.model<IReviewDocument>("Review", reviewSchema);
