import mongoose, { Schema, Document } from "mongoose";

export interface ICategoryDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  parent?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: "Category" },
  },
  { timestamps: true, versionKey: false },
);



export const Category = mongoose.model<ICategoryDocument>("Category", categorySchema);
