import mongoose, { Schema, Document } from "mongoose";

export interface INotificationDocument extends Document {
  user: mongoose.Types.ObjectId;
  type: "due_reminder" | "overdue" | "fine" | "reservation_available";
  title: string;
  message: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["due_reminder", "overdue", "fine", "reservation_available"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotificationDocument>(
  "Notification",
  notificationSchema,
);
