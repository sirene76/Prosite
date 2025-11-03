import mongoose, {
  Schema,
  type HydratedDocument,
  type InferSchemaType,
  type Model,
} from "mongoose";

/**
 * ✅ Website Schema
 */
const WebsiteSchema = new Schema(
  {
    name: { type: String, required: true },
    templateId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    user: { type: String },
    userEmail: { type: String },
    status: {
      type: String,
      enum: ["preview", "active"],
      default: "preview",
    },
plan: {
  type: String,
  enum: ["free", "basic", "standard", "premium", "Free", "Basic", "Standard", "Premium"],
  default: "free",
},

    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    subscriptionId: { type: String },
    planExpiresAt: { type: Date },
    subdomain: { type: String, trim: true, lowercase: true },
    deployment: {
      url: { type: String },
      lastDeployedAt: { type: Date },
    },
    theme: {
      name: { type: String, default: "default" },
      label: { type: String },
      colors: { type: Schema.Types.Mixed, default: {} },
      // fonts: { type: Schema.Types.Mixed, default: {} },
    },
    values: { type: Schema.Types.Mixed, default: {} },
    content: {
      websiteTitle: { type: String, default: "" },
      businessName: { type: String, default: "" },
      logoUrl: { type: String, default: "" },
      other: { type: Schema.Types.Mixed, default: {} },
    },
    pages: { type: [String], default: [] },
    html: { type: String },
    css: { type: String },
    js: { type: String },
    meta: { type: Schema.Types.Mixed },
    seo: {
      score: { type: Number, default: 0 },
      lastScan: { type: Date },
      suggestions: { type: [String], default: [] },
    },
    stripeSessionId: { type: String },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    analytics: { views: { type: Number, default: 0 } },
    previewImage: { type: String },
    thumbnailUrl: { type: String },
  },
  { timestamps: true }
);

// ✅ Use mongoose.models safely (never destructure "models")
export const Website: Model<InferSchemaType<typeof WebsiteSchema>> =
  (mongoose.models?.Website as Model<InferSchemaType<typeof WebsiteSchema>>) ||
  mongoose.model("Website", WebsiteSchema);

export type WebsiteModel = InferSchemaType<typeof WebsiteSchema>;
export type WebsiteDocument = HydratedDocument<WebsiteModel>;

export default Website;
