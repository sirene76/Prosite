import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

/**
 * ✅ Website Schema
 * This schema handles everything from builder data,
 * theme customization, SEO, analytics, and checkout info.
 */
const WebsiteSchema = new Schema(
  {
    // 🔹 Basic info
    name: { type: String, required: true },
    templateId: { type: String, required: true }, // slug or ObjectId
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    user: { type: String },
    userEmail: { type: String },

    // 🔹 Lifecycle
    status: {
      type: String,
      enum: ["preview", "active"],
      default: "preview",
    },

    // 🔹 Subscription plan info
    plan: {
      type: String,
      enum: [ "Free", "Basic", "Standard", "Premium"],
      default: "Free",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    subscriptionId: { type: String },
    planExpiresAt: { type: Date },

    // 🔹 Domain / deployment
    subdomain: { type: String, trim: true, lowercase: true },
    deployment: {
      url: { type: String },
      lastDeployedAt: { type: Date },
    },

    // 🔹 Theme + visual data (safe nesting)
    theme: {
      name: { type: String, default: "default" },
      label: { type: String },
      colors: {
        type: Schema.Types.Mixed,
        default: {},
      },
      fonts: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },

    // 🔹 Content & values from builder
    values: { type: Schema.Types.Mixed, default: {} },
    content: {
      websiteTitle: { type: String, default: "" },
      businessName: { type: String, default: "" },
      logoUrl: { type: String, default: "" },
      other: { type: Schema.Types.Mixed, default: {} },
    },

    // 🔹 Pages + code assets
    pages: { type: [String], default: [] },
    html: { type: String },
    css: { type: String },
    js: { type: String },
    meta: { type: Schema.Types.Mixed },

    // 🔹 SEO tracking
    seo: {
      score: { type: Number, default: 0 },
      lastScan: { type: Date },
      suggestions: { type: [String], default: [] },
    },

    // 🔹 Stripe & billing
    stripeSessionId: { type: String },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },

    // 🔹 Analytics
    analytics: {
      views: { type: Number, default: 0 },
    },

    // 🔹 Media & previews
    previewImage: { type: String },
    thumbnailUrl: { type: String },
  },
  { timestamps: true }
);

// ✅ Prevent duplicate model overwrite
export const Website = models.Website || model("Website", WebsiteSchema);

// 🔹 Types
export type WebsiteModel = InferSchemaType<typeof WebsiteSchema>;
export type WebsiteDocument = HydratedDocument<WebsiteModel>;

export default Website;
