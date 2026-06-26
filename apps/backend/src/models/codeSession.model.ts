import { Schema, model, Types, type HydratedDocument } from "mongoose";

const DEFAULT_CODE =
  "// Start coding together\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet('DevCollab'));\n";

export interface ICodeSession {
  sessionId: string;
  participants: Types.ObjectId[];
  code: string;
  language: string;
  createdBy: Types.ObjectId;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CodeSessionDocument = HydratedDocument<ICodeSession>;

const codeSessionSchema = new Schema<ICodeSession>(
  {
    sessionId: { type: String, required: true, unique: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    code: { type: String, default: DEFAULT_CODE },
    language: { type: String, default: "javascript" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isActive: { type: Boolean, default: true },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

codeSessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 86400 });

export const CodeSession = model<ICodeSession>("CodeSession", codeSessionSchema);
