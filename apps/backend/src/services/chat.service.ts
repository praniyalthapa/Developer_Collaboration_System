import type { Types } from "mongoose";
import { Chat, type ChatDocument, type IMessage } from "../models/chat.model";
import { USER_SAFE_FIELDS } from "../models/user.model";
import type { SafeUser } from "../types/dto";

const MESSAGE_SENDER_FIELDS = "firstName lastName photoUrl";

export const getOrCreateChat = async (
  userId: Types.ObjectId,
  targetUserId: string,
): Promise<ChatDocument> => {
  let chat = await Chat.findOne({
    participants: { $all: [userId, targetUserId] },
  }).populate({ path: "messages.senderId", select: MESSAGE_SENDER_FIELDS });

  if (!chat) {
    chat = await Chat.create({
      participants: [userId, targetUserId],
      messages: [],
    });
    return chat;
  }

  chat.lastSeen.set(userId.toString(), new Date());
  await chat.save();
  return chat;
};

export const sendMessage = async (
  userId: Types.ObjectId,
  targetUserId: string,
  text: string,
): Promise<IMessage> => {
  let chat = await Chat.findOne({
    participants: { $all: [userId, targetUserId] },
  });

  if (!chat) {
    chat = await Chat.create({
      participants: [userId, targetUserId],
      messages: [],
    });
  }

  chat.messages.push({ senderId: userId, text });
  await chat.save();
  await chat.populate({
    path: "messages.senderId",
    select: MESSAGE_SENDER_FIELDS,
  });

  return chat.messages[chat.messages.length - 1];
};

export interface ChatSummary {
  _id: Types.ObjectId;
  participant: SafeUser | null;
  latestMessage: Pick<IMessage, "_id" | "text" | "createdAt"> & {
    senderId: Types.ObjectId;
  } | null;
  unreadCount: number;
}

export const listChats = async (
  userId: Types.ObjectId,
): Promise<ChatSummary[]> => {
  const chats = await Chat.find({
    participants: userId,
    "messages.0": { $exists: true },
  })
    .populate<{ participants: SafeUser[] }>("participants", USER_SAFE_FIELDS)
    .sort({ updatedAt: -1 });

  return chats.map((chat) => {
    const other =
      chat.participants.find((participant) => !participant._id.equals(userId)) ??
      null;
    const lastSeen = chat.lastSeen.get(userId.toString());

    const unreadCount = chat.messages.reduce((count, message) => {
      const fromOther = !message.senderId.equals(userId);
      const afterLastSeen = !lastSeen || message.createdAt > lastSeen;
      return fromOther && afterLastSeen ? count + 1 : count;
    }, 0);

    const last = chat.messages[chat.messages.length - 1];

    return {
      _id: chat._id,
      participant: other,
      latestMessage: last
        ? { _id: last._id, text: last.text, createdAt: last.createdAt, senderId: last.senderId }
        : null,
      unreadCount,
    };
  });
};
