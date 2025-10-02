import { Schema, model, models, type HydratedDocument, type InferSchemaType } from "mongoose";

const themeSchema = new Schema(
  {
    name: { type: String },
    label: { type: String },
    colors: {
      type: Map,
      of: String,
      default: () => new Map<string, string>(),
    },
    fonts: {
      type: Map,
      of: String,
      default: () => new Map<string, string>(),
    },
  },
  { _id: false }
);

const websiteSchema = new Schema(
  {
    name: { type: String, required: true },
    templateId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    theme: { type: themeSchema, default: undefined },
    content: {
      type: Map,
      of: String,
      default: () => new Map<string, string>(),
    },
    thumbnailUrl: { type: String },
    previewImage: { type: String },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

export type WebsiteModel = InferSchemaType<typeof websiteSchema>;
export type WebsiteDocument = HydratedDocument<WebsiteModel>;

export const Website = models.Website<WebsiteModel> || model<WebsiteModel>("Website", websiteSchema);
