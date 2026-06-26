import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { Types } from "mongoose";
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
  code: string;
  language: string;
  participants: Participant[];
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
  codeChange: (payload: { sessionId: string; code: string }) => void;
  languageChange: (payload: { sessionId: string; language: string }) => void;
  userTyping: (payload: { sessionId: string; userName: string }) => void;
  userStoppedTyping: (payload: { sessionId: string }) => void;
  leaveCodeSession: (payload: { sessionId: string; userName: string }) => void;
  callJoin: (payload: { sessionId: string; userName: string }) => void;
  callLeave: (payload: { sessionId: string }) => void;
  callSignalOffer: (payload: { to: string; sdp: unknown }) => void;
  callSignalAnswer: (payload: { to: string; sdp: unknown }) => void;
  callSignalIce: (payload: { to: string; candidate: unknown }) => void;
  presenceJoin: (payload: { userId: string }) => void;
}

interface ServerToClientEvents {
  messageReceived: (payload: {
    firstName: string;
    lastName?: string;
    text: string;
    senderId: string;
    createdAt: Date;
  }) => void;
  codeUpdate: (payload: { code: string; language?: string }) => void;
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
  presenceState: (payload: { userIds: string[] }) => void;
  presenceOnline: (payload: { userId: string }) => void;
  presenceOffline: (payload: { userId: string }) => void;
}

const isSupportedLanguage = (value: string): value is SupportedLanguage =>
  (SUPPORTED_LANGUAGES as readonly string[]).includes(value);

export const initializeSocket = (
  server: HttpServer,
): Server<ClientToServerEvents, ServerToClientEvents> => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: { origin: corsOrigins, methods: ["GET", "POST"], credentials: true },
  });

  const activeSessions = new Map<string, ActiveSession>();
  const callRooms = new Map<string, Map<string, string>>();
  const onlineUsers = new Map<string, Set<string>>();
  const socketToUser = new Map<string, string>();

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
      async ({ firstName, lastName, userId, targetUserId, text }) => {
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
          chat.messages.push({
            senderId: new Types.ObjectId(userId),
            text: trimmed,
          });
          await chat.save();

          io.to(roomId).emit("messageReceived", {
            firstName,
            lastName,
            text: trimmed,
            senderId: userId,
            createdAt: new Date(),
          });
        } catch (error) {
          logger.error("Socket sendMessage failed", error);
        }
      },
    );

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
          active = {
            code: session.code,
            language: session.language,
            participants: [],
          };
          activeSessions.set(sessionId, active);
        }

        active.participants = active.participants.filter(
          (participant) => participant.socketId !== socket.id,
        );
        active.participants.push({ socketId: socket.id, userId, userName });

        socket.emit("codeUpdate", { code: active.code, language: active.language });
        io.to(sessionId).emit("participantJoined", {
          userName,
          participants: active.participants,
        });
      } catch (error) {
        logger.error("Socket joinCodeSession failed", error);
        socket.emit("codeSessionError", { message: "Failed to join session" });
      }
    });

    socket.on("codeChange", async ({ sessionId, code }) => {
      const active = activeSessions.get(sessionId);
      if (!active) return;
      active.code = code;
      socket.to(sessionId).emit("codeUpdate", { code });
      try {
        await CodeSession.findOneAndUpdate(
          { sessionId },
          { code, lastActivity: new Date() },
        );
      } catch (error) {
        logger.error("Socket codeChange persist failed", error);
      }
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

    socket.on("presenceJoin", ({ userId }) => {
      socketToUser.set(socket.id, userId);
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
