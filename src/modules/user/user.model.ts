import { model, Schema } from "mongoose";
import { IUser } from "./user.interface";

const userSchema = new Schema<IUser>(
  {
    name: { type: String, trim: true, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      validate: {
        validator: function (value) {
          return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
        },
        message: (props) => `${props.value} is not a valid email`,
      },
    },
    password: { type: String, required: true, minlength: 6 },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const User = model<IUser>("User", userSchema);

export default User;
