import { apiClient } from "../lib/apiClient";
import type { SmartMatch } from "../types/models";

export interface SmartMatchResponse {
  matches: SmartMatch[];
  total: number;
  page: number;
  totalPages: number;
}

export const getSmartMatches = async (
  page = 1,
  limit = 12,
): Promise<SmartMatchResponse> => {
  const res = await apiClient.get<SmartMatchResponse>("/smart-matches", {
    params: { page, limit },
  });
  return res.data;
};
