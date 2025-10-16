import mongoose, {
  Schema,
  models,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

export interface TemplateVersion {
  number: string;
  changelog?: string;
  previewUrl?: string;
  previewVideo?: string;
  htmlUrl?: string;
  cssUrl?: string;
  jsUrl?: string;
  metaUrl?: string;
  inlineHtml?: string;
  inlineCss?: string;
  inlineJs?: string;
  inlineMeta?: unknown;
  status?: "draft" | "published" | string;
  previewToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const TemplateVersionSchema = new Schema<TemplateVersion>(
  {
    number: { type: String, required: true },
    changelog: String,
    previewUrl: String,
    previewVideo: String,
    htmlUrl: String,
    cssUrl: String,
    jsUrl: String,
    metaUrl: String,
    inlineHtml: String,
    inlineCss: String,
    inlineJs: String,
    inlineMeta: Schema.Types.Mixed,
    status: String,
    previewToken: String,
  },
  {
    _id: false,
    timestamps: true,
  }
);

export const TemplateSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true },
    category: String,
    subcategory: String,
    description: String,
    image: String,
    thumbnail: String,
    tags: [String],
    published: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    currentVersion: String,
    previewUrl: String,
    previewVideo: String,

    html: String,
    css: String,
    js: String,

    htmlUrl: String,
    cssUrl: String,
    jsUrl: String,
    metaUrl: String,

    meta: Schema.Types.Mixed,
    versions: [TemplateVersionSchema],
  },
  { timestamps: true }
);

export type TemplateSchemaType = InferSchemaType<typeof TemplateSchema>;
export type TemplateDocument = HydratedDocument<TemplateSchemaType>;

export const Template =
  models.Template || mongoose.model("Template", TemplateSchema);
