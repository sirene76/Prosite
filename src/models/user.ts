import { Schema, model, models, type HydratedDocument } from "mongoose";

export interface IUser {
  email: string;
  password: string;
  stripeCustomerId?: string;
  subscriptionStatus?: "active" | "inactive" | "canceled";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    stripeCustomerId: { type: String },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "canceled"],
      default: "inactive",
    },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema);
export type UserDocument = HydratedDocument<IUser>;
