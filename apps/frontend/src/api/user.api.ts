import { apiClient, unwrap } from "../lib/apiClient";
import type {
  ReceivedRequest,
  SafeUser,
  SearchUser,
  SentRequest,
} from "../types/models";

export const getFeed = async (
  page = 1,
  limit = 12,
): Promise<SafeUser[]> => {
  const res = await apiClient.get<{ data: SafeUser[] }>("/feed", {
    params: { page, limit },
  });
  return unwrap(res.data);
};

export const getConnections = async (): Promise<SafeUser[]> => {
  const res = await apiClient.get<{ data: SafeUser[] }>("/user/connections");
  return unwrap(res.data);
};

export const searchUsers = async (query: string): Promise<SearchUser[]> => {
  const res = await apiClient.get<{ data: SearchUser[] }>("/user/search", {
    params: { q: query },
  });
  return unwrap(res.data);
};

export const getReceivedRequests = async (): Promise<ReceivedRequest[]> => {
  const res = await apiClient.get<{ data: ReceivedRequest[] }>(
    "/user/requests/received",
  );
  return unwrap(res.data);
};

export const getSentRequests = async (): Promise<SentRequest[]> => {
  const res = await apiClient.get<{ data: SentRequest[] }>(
    "/user/requests/sent",
  );
  return unwrap(res.data);
};
