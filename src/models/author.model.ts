import mongoose, { Schema, Document } from "mongoose";

export interface IAuthorDocument extends Document {
  name: string;
  bio?: string;
  birthDate?: Date;
  photo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const authorSchema = new Schema<IAuthorDocument>(
  {
    name: { type: String, required: true, trim: true },
    bio: { type: String, maxlength: 2000 },
    birthDate: { type: Date },
    photo: { type: String },
  },
  { timestamps: true, versionKey: false },
);

authorSchema.index({ name: 1 });
authorSchema.index({ name: "text" });

export const Author = mongoose.model<IAuthorDocument>("Author", authorSchema);
