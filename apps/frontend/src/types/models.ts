export type Gender = "male" | "female" | "other";
export type UserRole = "user" | "admin";
export type ConnectionStatus =
  | "ignored"
  | "interested"
  | "accepted"
  | "rejected";

export interface SafeUser {
  _id: string;
  firstName: string;
  lastName?: string;
  photoUrl: string;
  age?: number;
  gender?: Gender;
  about: string;
  skills: string[];
}

export type RelationshipStatus = "none" | "connected" | "requested" | "incoming";

export interface SearchUser extends SafeUser {
  connectionStatus: RelationshipStatus;
}

export interface CurrentUser extends SafeUser {
  emailId: string;
  role: UserRole;
  membershipType?: string;
  authProvider: "local" | "google";
  createdAt: string;
  updatedAt: string;
}

export interface FeedUser extends SafeUser {
  similarity?: number;
  sharedSkills?: string[];
}

export interface SmartMatch {
  user: SafeUser;
  similarity: number;
  sharedSkills: string[];
}

export interface ReceivedRequest {
  _id: string;
  status: ConnectionStatus;
  createdAt: string;
  fromUserId: SafeUser;
}

export interface SentRequest {
  _id: string;
  status: ConnectionStatus;
  createdAt: string;
  toUserId: SafeUser;
}

export interface MessageSender {
  _id: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
}

export type MessageStatus = "sent" | "delivered" | "read";

export interface ChatMessage {
  _id?: string;
  senderId: MessageSender | string;
  text: string;
  status?: MessageStatus;
  createdAt: string;
  clientId?: string;
}

export interface Chat {
  _id: string;
  participants: SafeUser[];
  messages: ChatMessage[];
}

export interface ChatSummary {
  _id: string;
  participant: SafeUser | null;
  latestMessage: { _id: string; text: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
}

export interface CodeSessionData {
  _id: string;
  sessionId: string;
  participants: SafeUser[];
  code: string;
  language: string;
  createdBy: string | SafeUser;
  isActive: boolean;
  lastActivity: string;
}

export interface AdminUser {
  _id: string;
  firstName: string;
  lastName?: string;
  emailId: string;
  role: UserRole;
  isSeed: boolean;
  authProvider: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  admins: number;
  acceptedConnections: number;
  pendingRequests: number;
  activeChats: number;
  codeSessions: number;
}
