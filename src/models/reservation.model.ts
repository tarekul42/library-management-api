import mongoose, { Schema, Document } from "mongoose";

export interface IReservationDocument extends Document {
  user: mongoose.Types.ObjectId;
  book: mongoose.Types.ObjectId;
  status: "waiting" | "fulfilled" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const reservationSchema = new Schema<IReservationDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    status: {
      type: String,
      enum: ["waiting", "fulfilled", "cancelled"],
      default: "waiting",
    },
  },
  { timestamps: true, versionKey: false },
);

reservationSchema.index({ book: 1, status: 1 });
reservationSchema.index({ user: 1, status: 1 });

export const Reservation = mongoose.model<IReservationDocument>(
  "Reservation",
  reservationSchema,
);
