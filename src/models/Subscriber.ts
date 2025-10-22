import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

const SubscriberSchema = new Schema(
  {
    siteId: { type: String, required: true },
    email: { type: String, required: true },
  },
  { timestamps: true }
);

export const Subscriber =
  models.Subscriber || model("Subscriber", SubscriberSchema);

export type SubscriberModel = InferSchemaType<typeof SubscriberSchema>;
export type SubscriberDocument = HydratedDocument<SubscriberModel>;

export default Subscriber;
