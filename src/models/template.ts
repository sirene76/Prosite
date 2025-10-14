import mongoose from "mongoose";

const VersionSchema = new mongoose.Schema(
  {
    number: { type: String, required: true },
    changelog: String,
    htmlUrl: String,
    cssUrl: String,
    metaUrl: String,
    previewUrl: String,
    previewVideo: String,
    inlineHtml: String,
    inlineCss: String,
    inlineMeta: String,
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    previewToken: String,
  },
  { _id: false }
);

const TemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    thumbnail: { type: String, required: false },
    previewVideo: { type: String, required: false },
    category: { type: String, index: true },
    subcategory: String,
    tags: [String],
    html: String,
    css: String,
    js: String,
    meta: mongoose.Schema.Types.Mixed,

    currentVersion: { type: String, default: "1.0.0" },
    versions: [VersionSchema],

    published: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Template =
  mongoose.models.Template || mongoose.model("Template", TemplateSchema);

export type TemplateVersion = mongoose.InferSchemaType<typeof VersionSchema>;

export type TemplateDocument = mongoose.InferSchemaType<typeof TemplateSchema> & {
  _id: mongoose.Types.ObjectId;
};
