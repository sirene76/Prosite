import mongoose, { Schema, models } from "mongoose";

const TemplateSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    slug: { type: String, required: true, unique: true },
    previewImage: { type: String },
    html: { type: String },
    css: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Template =
  models.Template || mongoose.model("Template", TemplateSchema);
