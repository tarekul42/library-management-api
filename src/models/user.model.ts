import mongoose, { Schema, Document } from "mongoose";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "librarian" | "member";
  avatar?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  fineBalance: number;
  borrowedCount: number;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "librarian", "member"],
      default: "member",
    },
    avatar: { type: String },
    phone: { type: String, trim: true },
    address: { type: String },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    fineBalance: { type: Number, default: 0, min: 0 },
    borrowedCount: { type: Number, default: 0, min: 0 },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });

export const User = mongoose.model<IUserDocument>("User", userSchema);
