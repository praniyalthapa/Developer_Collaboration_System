import {
  Schema,
  model,
  Types,
  type HydratedDocument,
  type CallbackError,
} from "mongoose";
import { CONNECTION_STATUSES, type ConnectionStatus } from "../types/enums";

export interface IConnectionRequest {
  fromUserId: Types.ObjectId;
  toUserId: Types.ObjectId;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ConnectionRequestDocument = HydratedDocument<IConnectionRequest>;

const connectionRequestSchema = new Schema<IConnectionRequest>(
  {
    fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, required: true, enum: CONNECTION_STATUSES },
  },
  { timestamps: true },
);

connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 });
connectionRequestSchema.index({ toUserId: 1, status: 1 });

connectionRequestSchema.pre("save", function (next) {
  if (this.fromUserId.equals(this.toUserId)) {
    next(new Error("Cannot send a connection request to yourself") as CallbackError);
    return;
  }
  next();
});

export const ConnectionRequest = model<IConnectionRequest>(
  "ConnectionRequest",
  connectionRequestSchema,
);
