import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

const WebsiteSchema = new Schema(
  {
    name: { type: String, required: true },
    templateId: { type: String, required: true }, // slug like "agency-starter"
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    user: { type: String },
    status: {
      type: String,
      enum: ["preview", "active"],
      default: "preview",
      set: (value: string) => {
        if (typeof value !== "string") {
          return "preview";
        }
        const normalized = value.toLowerCase();
        if (normalized === "active") {
          return "active";
        }
        return "preview";
      },
    },
    plan: {
      type: String,
      enum: ["Free", "Pro", "Agency"],
      default: "Free",
      set: (value: string) => {
        if (typeof value !== "string") {
          return "Free";
        }
        const normalized = value.toLowerCase();
        if (normalized === "pro") {
          return "Pro";
        }
        if (normalized === "agency") {
          return "Agency";
        }
        return "Free";
      },
    },
    subdomain: { type: String, trim: true, lowercase: true },
    theme: {
      colors: { type: Object, default: {} },
      fonts: { type: Object, default: {} },
      name: { type: String },
      label: { type: String },
    },
    values: { type: Schema.Types.Mixed },
    content: { type: Schema.Types.Mixed },
    pages: { type: [String], default: [] },
    html: { type: String },
    css: { type: String },
    meta: { type: Schema.Types.Mixed },
    seo: {
      score: { type: Number, default: 0 },
      lastScan: { type: Date },
      suggestions: { type: [String], default: [] },
    },
    previewImage: { type: String },
    thumbnailUrl: { type: String },
    stripeSessionId: { type: String },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    deployment: {
      url: { type: String },
      lastDeployedAt: { type: Date },
    },
    analytics: {
      views: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const Website = models.Website || model("Website", WebsiteSchema);

export type WebsiteModel = InferSchemaType<typeof WebsiteSchema>;
export type WebsiteDocument = HydratedDocument<WebsiteModel>;

export default Website;
