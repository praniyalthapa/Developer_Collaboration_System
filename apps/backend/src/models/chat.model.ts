import { Schema, model, Types, type HydratedDocument } from "mongoose";

export type MessageStatus = "sent" | "delivered" | "read";

export interface IMessage {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;
  text: string;
  status: MessageStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChat {
  participants: Types.ObjectId[];
  messages: Types.DocumentArray<IMessage>;
  lastSeen: Map<string, Date>;
}

export type ChatDocument = HydratedDocument<IChat>;

const messageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  { timestamps: true },
);

const chatSchema = new Schema<IChat>({
  participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
  messages: [messageSchema],
  lastSeen: { type: Map, of: Date, default: () => new Map<string, Date>() },
});

chatSchema.index({ participants: 1 });

export const Chat = model<IChat>("Chat", chatSchema);
