import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

const AnalyticsSchema = new Schema(
  {
    siteId: { type: String, required: true, index: true },
    date: { type: Date, default: Date.now },
    seoScore: { type: Number },
    visits: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
  },
  { timestamps: false }
);

AnalyticsSchema.index({ siteId: 1, date: 1 });

export const Analytics = models.Analytics || model("Analytics", AnalyticsSchema);

export type AnalyticsModel = InferSchemaType<typeof AnalyticsSchema>;
export type AnalyticsDocument = HydratedDocument<AnalyticsModel>;

export default Analytics;
