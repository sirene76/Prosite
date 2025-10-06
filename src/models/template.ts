import { Schema, model, models, type HydratedDocument, type InferSchemaType, type Model } from "mongoose";

const TemplateSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String },
    description: { type: String },
    previewImage: { type: String },
    previewVideo: { type: String },
    previewImages: [{ type: String }],
    features: [{ type: String }],
    path: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

type TemplateSchemaType = InferSchemaType<typeof TemplateSchema>;

export const Template = (models.Template as Model<TemplateSchemaType>) ||
  model<TemplateSchemaType>("Template", TemplateSchema);

export type TemplateModel = TemplateSchemaType;
export type TemplateDocument = HydratedDocument<TemplateSchemaType>;
