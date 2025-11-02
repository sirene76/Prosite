import mongoose, {
  Schema,
  Model,
  models,
  Document,
  type HydratedDocument,
} from "mongoose";

export interface IUser extends Document {
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

// ✅ Always reference mongoose.models, not destructured models (can be undefined)
export const User: Model<IUser> =
  (mongoose.models?.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

export type UserDocument = mongoose.HydratedDocument<IUser>;
