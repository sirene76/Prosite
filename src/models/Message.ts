import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

const MessageSchema = new Schema(
  {
    siteId: { type: String, required: true },
    name: { type: String },
    email: { type: String },
    message: { type: String },
  },
  { timestamps: true }
);

export const Message = models.Message || model("Message", MessageSchema);

export type MessageModel = InferSchemaType<typeof MessageSchema>;
export type MessageDocument = HydratedDocument<MessageModel>;

export default Message;
