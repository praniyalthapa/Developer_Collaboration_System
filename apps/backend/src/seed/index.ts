import { Types } from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { User } from "../models/user.model";
import { ConnectionRequest } from "../models/connectionRequest.model";
import { Chat } from "../models/chat.model";
import { hashPassword } from "../utils/password";
import { logger } from "../utils/logger";
import { env } from "../config/env";
import {
  buildAdminUser,
  demoUsers,
  SEED_ACCEPTED,
  SEED_CHATS,
  SEED_PENDING,
  SEED_SENT,
  type SeedUser,
} from "./data";
import type { ConnectionStatus } from "../types/enums";

const upsertUser = async (user: SeedUser): Promise<string> => {
  const { password, ...profile } = user;
  const passwordHash = await hashPassword(password);

  const doc = await User.findOneAndUpdate(
    { emailId: user.emailId },
    {
      $set: {
        ...profile,
        password: passwordHash,
        isSeed: true,
        authProvider: "local",
      },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  if (!doc) {
    throw new Error(`Failed to upsert seed user ${user.emailId}`);
  }
  return doc._id.toString();
};

const ensureRequest = async (
  fromId: string,
  toId: string,
  status: ConnectionStatus,
): Promise<void> => {
  await ConnectionRequest.findOneAndUpdate(
    { fromUserId: fromId, toUserId: toId },
    {
      $set: { status },
      $setOnInsert: { fromUserId: fromId, toUserId: toId },
    },
    { upsert: true },
  );
};

const ensureChat = async (
  aId: string,
  bId: string,
  messages: Array<{ senderId: string; text: string }>,
): Promise<void> => {
  const existing = await Chat.findOne({ participants: { $all: [aId, bId] } });
  if (existing && existing.messages.length > 0) return;

  const chat = existing ?? new Chat({ participants: [aId, bId], messages: [] });
  for (const message of messages) {
    chat.messages.push({
      senderId: new Types.ObjectId(message.senderId),
      text: message.text,
    });
  }
  await chat.save();
};

const seedRelationships = async (
  idByEmail: Map<string, string>,
): Promise<void> => {
  const id = (email: string): string | undefined => idByEmail.get(email);

  for (const [from, to] of SEED_ACCEPTED) {
    const f = id(from);
    const t = id(to);
    if (f && t) await ensureRequest(f, t, "accepted");
  }
  for (const [from, to] of SEED_PENDING) {
    const f = id(from);
    const t = id(to);
    if (f && t) await ensureRequest(f, t, "interested");
  }
  for (const [from, to] of SEED_SENT) {
    const f = id(from);
    const t = id(to);
    if (f && t) await ensureRequest(f, t, "interested");
  }
  for (const chat of SEED_CHATS) {
    const a = id(chat.participants[0]);
    const b = id(chat.participants[1]);
    if (!a || !b) continue;
    const messages = chat.messages
      .map((message) => {
        const senderId = id(message.from);
        return senderId ? { senderId, text: message.text } : null;
      })
      .filter((message): message is { senderId: string; text: string } =>
        Boolean(message),
      );
    await ensureChat(a, b, messages);
  }
};

const run = async (): Promise<void> => {
  await connectDatabase();

  const idByEmail = new Map<string, string>();
  const admin = buildAdminUser(env.ADMIN_EMAIL, env.ADMIN_PASSWORD);
  idByEmail.set(admin.emailId, await upsertUser(admin));
  for (const demoUser of demoUsers) {
    idByEmail.set(demoUser.emailId, await upsertUser(demoUser));
  }

  await seedRelationships(idByEmail);

  logger.info(
    `Seed complete: admin <${admin.emailId}>, ${demoUsers.length} demo users, plus connections, requests, and a sample chat`,
  );
  await disconnectDatabase();
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error("Seeding failed", error);
    process.exit(1);
  });
