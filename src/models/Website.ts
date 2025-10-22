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
      enum: ["draft", "deploying", "active", "published"],
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
      name: { type: String },
      label: { type: String },
    },
    values: { type: Schema.Types.Mixed },
    content: { type: Schema.Types.Mixed },
    pages: { type: [String], default: [] },
    html: { type: String },
    css: { type: String },
    meta: { type: Schema.Types.Mixed },
    previewImage: { type: String },
    thumbnailUrl: { type: String },
    stripeSessionId: { type: String },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    deployment: { type: Schema.Types.Mixed },
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
