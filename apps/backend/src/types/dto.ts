import type { Types } from "mongoose";
import type { Gender } from "./enums";

export interface SafeUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName?: string;
  photoUrl: string;
  age?: number;
  gender?: Gender;
  about: string;
  skills: string[];
}

// Relationship of a listed user to the current viewer, used to render the right
// action (Connect / Requested / Respond / Connected) instead of always "Connect".
export type RelationshipStatus = "none" | "connected" | "requested" | "incoming";

export interface SearchUser extends SafeUser {
  connectionStatus: RelationshipStatus;
}
