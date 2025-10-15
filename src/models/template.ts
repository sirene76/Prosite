import mongoose, { Schema, models } from "mongoose";

const TemplateSchema = new Schema(
  {
    name: String,
    slug: { type: String, unique: true, sparse: true },
    category: String,
    description: String,
    image: String,
    published: { type: Boolean, default: true },

    html: String,
    css: String,
    js: String,

    meta: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const Template =
  models.Template || mongoose.model("Template", TemplateSchema);
