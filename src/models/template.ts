import mongoose from "mongoose";

const TemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    category: String,
    previewUrl: String,
    previewVideo: String,
    htmlUrl: String,
    cssUrl: String,
    metaUrl: String,
    themes: [
      {
        name: String,
        colors: { type: Map, of: String },
      },
    ],
    published: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Template =
  mongoose.models.Template || mongoose.model("Template", TemplateSchema);

export type TemplateDocument = mongoose.InferSchemaType<typeof TemplateSchema> & {
  _id: mongoose.Types.ObjectId;
};
