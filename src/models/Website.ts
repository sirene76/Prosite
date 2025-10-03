import mongoose, { Schema, type Model, type Document } from "mongoose";

export type WebsiteStatus = "draft" | "active";
export type WebsitePlan = "export" | "agency" | null | undefined;

export interface WebsiteDocument extends Document {
  name?: string;
  user: string;
  templateId?: string;
  status: WebsiteStatus;
  plan: WebsitePlan;
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteSchema = new Schema<WebsiteDocument>(
  {
    name: { type: String },
    user: { type: String, required: true },
    templateId: { type: String },
    status: { type: String, enum: ["draft", "active"], default: "draft" },
    plan: {
      type: String,
      enum: ["export", "agency"],
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

export const Website: Model<WebsiteDocument> =
  (mongoose.models.Website as Model<WebsiteDocument>) ||
  mongoose.model<WebsiteDocument>("Website", WebsiteSchema);
