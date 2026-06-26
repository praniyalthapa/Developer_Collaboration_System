import { apiClient, unwrap } from "../lib/apiClient";
import type { Chat, ChatSummary } from "../types/models";

export const getChat = async (targetUserId: string): Promise<Chat> => {
  const res = await apiClient.get<{ data: Chat }>(`/chat/${targetUserId}`);
  return unwrap(res.data);
};

export const listChats = async (): Promise<ChatSummary[]> => {
  const res = await apiClient.get<{ data: ChatSummary[] }>("/chats");
  return unwrap(res.data);
};
