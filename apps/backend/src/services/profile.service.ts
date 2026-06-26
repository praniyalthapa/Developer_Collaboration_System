import { User, type UserDocument } from "../models/user.model";
import { ConnectionRequest } from "../models/connectionRequest.model";
import { Chat } from "../models/chat.model";
import type { EditProfileInput } from "../validators/profile.schema";

export const updateProfile = async (
  user: UserDocument,
  changes: EditProfileInput,
): Promise<UserDocument> => {
  user.set(changes);
  await user.save();
  return user;
};

export const deleteAccount = async (user: UserDocument): Promise<void> => {
  const userId = user._id;
  await Promise.all([
    ConnectionRequest.deleteMany({
      $or: [{ fromUserId: userId }, { toUserId: userId }],
    }),
    Chat.deleteMany({ participants: userId }),
  ]);
  await User.findByIdAndDelete(userId);
};
