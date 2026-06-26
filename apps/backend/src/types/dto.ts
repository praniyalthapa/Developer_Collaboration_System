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
