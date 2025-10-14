import mongoose, { Schema, models } from "mongoose";

const TemplateSchema = new Schema(
  {
    name: String,
    category: String,
    description: String,
    image: String,

    html: String,
    css: String,
    js: String,

    meta: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const Template =
  models.Template || mongoose.model("Template", TemplateSchema);
