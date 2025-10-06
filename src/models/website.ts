import { Schema, model, models, type HydratedDocument, type InferSchemaType } from "mongoose";

const WebsiteSchema = new Schema(
  {
    name: { type: String, required: true },
    templateId: { type: String, required: true }, // slug like "agency-starter"
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    user: { type: String },
    status: {
      type: String,
      enum: ["draft", "active", "published"],
      default: "draft",
    },
    plan: {
      type: String,
      enum: ["free", "pro", "agency"],
      default: "free",
    },
    theme: {
      colors: { type: Object, default: {} },
      fonts: { type: Object, default: {} },
    },
  },
  { timestamps: true }
);

export const Website = models.Website || model("Website", WebsiteSchema);

export type WebsiteModel = InferSchemaType<typeof WebsiteSchema>;
export type WebsiteDocument = HydratedDocument<WebsiteModel>;
