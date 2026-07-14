import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "./apiClient";

export interface Participant {
  socketId: string;
  userId: string;
  userName: string;
}

export interface ServerToClientEvents {
  messageReceived: (payload: {
    _id: string;
    firstName: string;
    lastName?: string;
    text: string;
    senderId: string;
    status: "sent" | "delivered" | "read";
    clientId?: string;
    createdAt: string;
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
  callReady: (payload: {
    peers: Array<{ socketId: string; userName: string }>;
  }) => void;
  callPeerJoined: (payload: { socketId: string; userName: string }) => void;
  callPeerLeft: (payload: { socketId: string }) => void;
  callOffer: (payload: { from: string; sdp: RTCSessionDescriptionInit }) => void;
  callAnswer: (payload: { from: string; sdp: RTCSessionDescriptionInit }) => void;
  callIce: (payload: { from: string; candidate: RTCIceCandidateInit }) => void;
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
    createdAt: string;
  }) => void;
  presenceState: (payload: { userIds: string[] }) => void;
  presenceOnline: (payload: { userId: string }) => void;
  presenceOffline: (payload: { userId: string }) => void;
  connectionRequestReceived: (payload: {
    fromUserId: string;
    fromName: string;
  }) => void;
}

export interface ClientToServerEvents {
  joinChat: (payload: { userId: string; targetUserId: string }) => void;
  sendMessage: (payload: {
    firstName: string;
    lastName?: string;
    userId: string;
    targetUserId: string;
    text: string;
    clientId?: string;
  }) => void;
  markRead: (payload: { userId: string; targetUserId: string }) => void;
  joinCodeSession: (payload: {
    sessionId: string;
    userId: string;
    userName: string;
  }) => void;
  codeChange: (payload: { sessionId: string; code: string }) => void;
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
  callSignalOffer: (payload: { to: string; sdp: RTCSessionDescriptionInit }) => void;
  callSignalAnswer: (payload: { to: string; sdp: RTCSessionDescriptionInit }) => void;
  callSignalIce: (payload: { to: string; candidate: RTCIceCandidateInit }) => void;
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
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const socketOrigin = (): string =>
  API_BASE_URL.startsWith("http")
    ? API_BASE_URL.replace(/\/api\/?$/, "")
    : window.location.origin;

export const createSocket = (): AppSocket =>
  io(socketOrigin(), { withCredentials: true });
