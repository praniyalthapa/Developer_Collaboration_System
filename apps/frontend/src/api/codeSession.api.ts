import { apiClient, unwrap } from "../lib/apiClient";
import type { CodeSessionData } from "../types/models";

export const createCodeSession = async (
  targetUserId: string,
): Promise<CodeSessionData> => {
  const res = await apiClient.post<{ data: CodeSessionData }>(
    "/code-session/create",
    { targetUserId },
  );
  return unwrap(res.data);
};

export const getCodeSession = async (
  sessionId: string,
): Promise<CodeSessionData> => {
  const res = await apiClient.get<{ data: CodeSessionData }>(
    `/code-session/${sessionId}`,
  );
  return unwrap(res.data);
};
