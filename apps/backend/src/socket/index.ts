import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { Types } from "mongoose";
import * as Y from "yjs";
import { corsOrigins } from "../config/env";
import { Chat } from "../models/chat.model";
import { CodeSession } from "../models/codeSession.model";
import { getSecretRoomId } from "../utils/room";
import { logger } from "../utils/logger";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "../types/enums";

interface Participant {
  socketId: string;
  userId: string;
  userName: string;
}

interface ActiveSession {
  // The Yjs document is the source of truth for the shared editor. It supports
  // true concurrent editing (character-level merges) instead of last-write-wins.
  doc: Y.Doc;
  language: string;
  participants: Participant[];
  saveTimer: NodeJS.Timeout | null;
}

interface JoinChatPayload {
  userId: string;
  targetUserId: string;
}

interface SendMessagePayload {
  firstName: string;
  lastName?: string;
  userId: string;
  targetUserId: string;
  text: string;
  clientId?: string;
}

interface JoinCodeSessionPayload {
  sessionId: string;
  userId: string;
  userName: string;
}

interface ClientToServerEvents {
  joinChat: (payload: JoinChatPayload) => void;
  sendMessage: (payload: SendMessagePayload) => void;
  joinCodeSession: (payload: JoinCodeSessionPayload) => void;
  yjsUpdate: (payload: { sessionId: string; update: number[] }) => void;
  sessionChat: (payload: {
    sessionId: string;
    userName: string;
    text: string;
  }) => void;
  languageChange: (payload: { sessionId: string; language: string }) => void;
  userTyping: (payload: { sessionId: string; userName: string }) => void;
  userStoppedTyping: (payload: { sessionId: string }) => void;
  leaveCodeSession: (payload: { sessionId: string; userName: string }) => void;
  callJoin: (payload: { sessionId: string; userName: string }) => void;
  callLeave: (payload: { sessionId: string }) => void;
  callSignalOffer: (payload: { to: string; sdp: unknown }) => void;
  callSignalAnswer: (payload: { to: string; sdp: unknown }) => void;
  callSignalIce: (payload: { to: string; candidate: unknown }) => void;
  callInvite: (payload: {
    toUserId: string;
    room: string;
    fromUserId: string;
    fromName: string;
  }) => void;
  callInviteResponse: (payload: {
    toUserId: string;
    room: string;
    accepted: boolean;
  }) => void;
  callCancel: (payload: { toUserId: string; room: string }) => void;
  presenceJoin: (payload: { userId: string }) => void;
  markRead: (payload: { userId: string; targetUserId: string }) => void;
}

interface ServerToClientEvents {
  messageReceived: (payload: {
    _id: string;
    firstName: string;
    lastName?: string;
    text: string;
    senderId: string;
    status: "sent" | "delivered" | "read";
    clientId?: string;
    createdAt: Date;
  }) => void;
  messagesDelivered: (payload: { withUserId: string }) => void;
  messagesRead: (payload: { withUserId: string }) => void;
  codeUpdate: (payload: { code: string; language?: string }) => void;
  yjsSync: (payload: { update: number[] }) => void;
  yjsUpdate: (payload: { update: number[] }) => void;
  sessionChatMessage: (payload: {
    userName: string;
    text: string;
    at: string;
  }) => void;
  languageUpdate: (payload: { language: string }) => void;
  participantJoined: (payload: {
    userName: string;
    participants: Participant[];
  }) => void;
  participantLeft: (payload: {
    userName: string;
    participants: Participant[];
  }) => void;
  userTyping: (payload: { userName: string }) => void;
  userStoppedTyping: () => void;
  codeSessionError: (payload: { message: string }) => void;
  callReady: (payload: { peers: Array<{ socketId: string; userName: string }> }) => void;
  callPeerJoined: (payload: { socketId: string; userName: string }) => void;
  callPeerLeft: (payload: { socketId: string }) => void;
  callOffer: (payload: { from: string; sdp: unknown }) => void;
  callAnswer: (payload: { from: string; sdp: unknown }) => void;
  callIce: (payload: { from: string; candidate: unknown }) => void;
  callIncoming: (payload: {
    room: string;
    fromUserId: string;
    fromName: string;
  }) => void;
  callAccepted: (payload: { room: string }) => void;
  callDeclined: (payload: { room: string }) => void;
  callCancelled: (payload: { room: string }) => void;
  messageNotification: (payload: {
    fromUserId: string;
    fromName: string;
    text: string;
    createdAt: Date;
  }) => void;
  presenceState: (payload: { userIds: string[] }) => void;
  presenceOnline: (payload: { userId: string }) => void;
  presenceOffline: (payload: { userId: string }) => void;
  connectionRequestReceived: (payload: {
    fromUserId: string;
    fromName: string;
  }) => void;
}

type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;

// Module-level handle so HTTP controllers (e.g. sending a connection request)
// can push realtime notifications to a user's socket room without threading the
// io instance through every layer.
let ioRef: AppServer | null = null;
export const getIo = (): AppServer | null => ioRef;

const isSupportedLanguage = (value: string): value is SupportedLanguage =>
  (SUPPORTED_LANGUAGES as readonly string[]).includes(value);

export const initializeSocket = (
  server: HttpServer,
): Server<ClientToServerEvents, ServerToClientEvents> => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: { origin: corsOrigins, methods: ["GET", "POST"], credentials: true },
  });
  ioRef = io;

  const activeSessions = new Map<string, ActiveSession>();

  const persistSession = async (
    sessionId: string,
    active: ActiveSession,
  ): Promise<void> => {
    try {
      await CodeSession.findOneAndUpdate(
        { sessionId },
        {
          code: active.doc.getText("monaco").toString(),
          language: active.language,
          lastActivity: new Date(),
        },
      );
    } catch (error) {
      logger.error("Socket persistSession failed", error);
    }
  };
  const callRooms = new Map<string, Map<string, string>>();
  const onlineUsers = new Map<string, Set<string>>();
  const socketToUser = new Map<string, string>();

  const isOnline = (userId: string): boolean =>
    (onlineUsers.get(userId)?.size ?? 0) > 0;

  const leaveCall = (socketId: string, sessionId: string): void => {
    const room = callRooms.get(sessionId);
    if (!room || !room.has(socketId)) return;
    room.delete(socketId);
    for (const peerId of room.keys()) {
      io.to(peerId).emit("callPeerLeft", { socketId });
    }
    if (room.size === 0) callRooms.delete(sessionId);
  };

  io.on("connection", (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    socket.on("joinChat", ({ userId, targetUserId }) => {
      socket.join(getSecretRoomId(userId, targetUserId));
    });

    socket.on(
      "sendMessage",
      async ({ firstName, lastName, userId, targetUserId, text, clientId }) => {
        const trimmed = text?.trim();
        if (!trimmed) return;
        try {
          const roomId = getSecretRoomId(userId, targetUserId);
          let chat = await Chat.findOne({
            participants: { $all: [userId, targetUserId] },
          });
          if (!chat) {
            chat = await Chat.create({
              participants: [userId, targetUserId],
              messages: [],
            });
          }
          // If the recipient is connected anywhere in the app, the message is
          // "delivered"; otherwise it's just "sent" until they come online.
          const status = isOnline(targetUserId) ? "delivered" : "sent";
          chat.messages.push({
            senderId: new Types.ObjectId(userId),
            text: trimmed,
            status,
          });
          await chat.save();
          const saved = chat.messages[chat.messages.length - 1];

          io.to(roomId).emit("messageReceived", {
            _id: saved._id.toString(),
            firstName,
            lastName,
            text: trimmed,
            senderId: userId,
            status,
            clientId,
            createdAt: saved.createdAt,
          });

          // Notify the recipient's global socket (for toasts/badges) even when
          // they don't currently have this conversation open.
          io.to(`user:${targetUserId}`).emit("messageNotification", {
            fromUserId: userId,
            fromName: `${firstName} ${lastName ?? ""}`.trim(),
            text: trimmed,
            createdAt: saved.createdAt,
          });
        } catch (error) {
          logger.error("Socket sendMessage failed", error);
        }
      },
    );

    // The reader (userId) opened a conversation with targetUserId, so every
    // message targetUserId sent them is now "read". Tell the sender so their
    // ticks turn blue.
    socket.on("markRead", async ({ userId, targetUserId }) => {
      try {
        const chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        });
        if (!chat) return;
        let changed = false;
        for (const message of chat.messages) {
          if (!message.senderId.equals(userId) && message.status !== "read") {
            message.status = "read";
            changed = true;
          }
        }
        chat.lastSeen.set(userId, new Date());
        await chat.save();
        if (changed) {
          io.to(`user:${targetUserId}`).emit("messagesRead", { withUserId: userId });
        }
      } catch (error) {
        logger.error("Socket markRead failed", error);
      }
    });

    socket.on("joinCodeSession", async ({ sessionId, userId, userName }) => {
      try {
        const session = await CodeSession.findOne({ sessionId });
        if (!session) {
          socket.emit("codeSessionError", { message: "Session not found" });
          return;
        }

        socket.join(sessionId);

        let active = activeSessions.get(sessionId);
        if (!active) {
          // First person in: hydrate a fresh Yjs doc from the last-saved code.
          const doc = new Y.Doc();
          if (session.code) doc.getText("monaco").insert(0, session.code);
          active = {
            doc,
            language: session.language,
            participants: [],
            saveTimer: null,
          };
          activeSessions.set(sessionId, active);
        }

        active.participants = active.participants.filter(
          (participant) => participant.socketId !== socket.id,
        );
        active.participants.push({ socketId: socket.id, userId, userName });

        // Ship the full document state so the joiner's editor converges to the
        // current shared content, then the language.
        socket.emit("yjsSync", {
          update: Array.from(Y.encodeStateAsUpdate(active.doc)),
        });
        socket.emit("languageUpdate", { language: active.language });
        io.to(sessionId).emit("participantJoined", {
          userName,
          participants: active.participants,
        });
      } catch (error) {
        logger.error("Socket joinCodeSession failed", error);
        socket.emit("codeSessionError", { message: "Failed to join session" });
      }
    });

    socket.on("yjsUpdate", ({ sessionId, update }) => {
      const active = activeSessions.get(sessionId);
      if (!active) return;
      // Apply the incremental CRDT update to the authoritative doc, fan it out to
      // the other participants, and debounce a write-back to the database.
      Y.applyUpdate(active.doc, Uint8Array.from(update));
      socket.to(sessionId).emit("yjsUpdate", { update });
      if (active.saveTimer) clearTimeout(active.saveTimer);
      active.saveTimer = setTimeout(() => {
        void persistSession(sessionId, active);
      }, 800);
    });

    socket.on("sessionChat", ({ sessionId, userName, text }) => {
      const trimmed = text?.trim();
      if (!trimmed) return;
      io.to(sessionId).emit("sessionChatMessage", {
        userName,
        text: trimmed,
        at: new Date().toISOString(),
      });
    });

    socket.on("languageChange", async ({ sessionId, language }) => {
      const active = activeSessions.get(sessionId);
      if (!active || !isSupportedLanguage(language)) return;
      active.language = language;
      io.to(sessionId).emit("languageUpdate", { language });
      try {
        await CodeSession.findOneAndUpdate(
          { sessionId },
          { language, lastActivity: new Date() },
        );
      } catch (error) {
        logger.error("Socket languageChange persist failed", error);
      }
    });

    socket.on("userTyping", ({ sessionId, userName }) => {
      socket.to(sessionId).emit("userTyping", { userName });
    });

    socket.on("userStoppedTyping", ({ sessionId }) => {
      socket.to(sessionId).emit("userStoppedTyping");
    });

    const removeFromSession = (sessionId: string, userName?: string): void => {
      const active = activeSessions.get(sessionId);
      if (!active) return;
      const leaving =
        userName ??
        active.participants.find((p) => p.socketId === socket.id)?.userName ??
        "A participant";
      active.participants = active.participants.filter(
        (participant) => participant.socketId !== socket.id,
      );
      io.to(sessionId).emit("participantLeft", {
        userName: leaving,
        participants: active.participants,
      });
      if (active.participants.length === 0) {
        // Everyone left — flush the final state before discarding the doc.
        if (active.saveTimer) clearTimeout(active.saveTimer);
        void persistSession(sessionId, active);
        activeSessions.delete(sessionId);
      }
    };

    socket.on("leaveCodeSession", ({ sessionId, userName }) => {
      removeFromSession(sessionId, userName);
      socket.leave(sessionId);
    });

    socket.on("callJoin", ({ sessionId, userName }) => {
      let room = callRooms.get(sessionId);
      if (!room) {
        room = new Map();
        callRooms.set(sessionId, room);
      }
      const existing = Array.from(room.entries()).map(([socketId, name]) => ({
        socketId,
        userName: name,
      }));
      room.set(socket.id, userName);
      socket.emit("callReady", { peers: existing });
      for (const peer of existing) {
        io.to(peer.socketId).emit("callPeerJoined", {
          socketId: socket.id,
          userName,
        });
      }
    });

    socket.on("presenceJoin", async ({ userId }) => {
      socketToUser.set(socket.id, userId);
      socket.join(`user:${userId}`);
      let sockets = onlineUsers.get(userId);
      const wasOffline = !sockets || sockets.size === 0;
      if (!sockets) {
        sockets = new Set();
        onlineUsers.set(userId, sockets);
      }
      sockets.add(socket.id);
      socket.emit("presenceState", { userIds: Array.from(onlineUsers.keys()) });
      if (wasOffline) {
        socket.broadcast.emit("presenceOnline", { userId });
        // This user just came online: any messages still "sent" to them are now
        // "delivered" — flip them and notify each sender so ticks go double.
        try {
          const chats = await Chat.find({
            participants: userId,
            "messages.status": "sent",
          });
          for (const chat of chats) {
            const other = chat.participants.find((p) => !p.equals(userId));
            if (!other) continue;
            let changed = false;
            for (const message of chat.messages) {
              if (message.status === "sent" && !message.senderId.equals(userId)) {
                message.status = "delivered";
                changed = true;
              }
            }
            if (changed) {
              await chat.save();
              io.to(`user:${other.toString()}`).emit("messagesDelivered", {
                withUserId: userId,
              });
            }
          }
        } catch (error) {
          logger.error("Socket deliver-on-presence failed", error);
        }
      }
    });

    socket.on("callLeave", ({ sessionId }) => leaveCall(socket.id, sessionId));
    socket.on("callSignalOffer", ({ to, sdp }) =>
      io.to(to).emit("callOffer", { from: socket.id, sdp }),
    );
    socket.on("callSignalAnswer", ({ to, sdp }) =>
      io.to(to).emit("callAnswer", { from: socket.id, sdp }),
    );
    socket.on("callSignalIce", ({ to, candidate }) =>
      io.to(to).emit("callIce", { from: socket.id, candidate }),
    );

    // Ringing / invitation layer (routed by userId, not socketId, so the
    // callee is reached wherever they are in the app).
    socket.on("callInvite", ({ toUserId, room, fromUserId, fromName }) => {
      io.to(`user:${toUserId}`).emit("callIncoming", {
        room,
        fromUserId,
        fromName,
      });
    });
    socket.on("callInviteResponse", ({ toUserId, room, accepted }) => {
      io.to(`user:${toUserId}`).emit(
        accepted ? "callAccepted" : "callDeclined",
        { room },
      );
    });
    socket.on("callCancel", ({ toUserId, room }) => {
      io.to(`user:${toUserId}`).emit("callCancelled", { room });
    });

    socket.on("disconnect", () => {
      for (const sessionId of activeSessions.keys()) {
        removeFromSession(sessionId);
      }
      for (const sessionId of callRooms.keys()) {
        leaveCall(socket.id, sessionId);
      }
      const userId = socketToUser.get(socket.id);
      if (userId) {
        socketToUser.delete(socket.id);
        const sockets = onlineUsers.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            onlineUsers.delete(userId);
            io.emit("presenceOffline", { userId });
          }
        }
      }
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
