import { apiClient } from "../lib/apiClient";

export type SendStatus = "interested" | "ignored";
export type ReviewStatus = "accepted" | "rejected";

export const sendRequest = async (
  status: SendStatus,
  toUserId: string,
): Promise<void> => {
  await apiClient.post(`/request/send/${status}/${toUserId}`);
};

export const reviewRequest = async (
  status: ReviewStatus,
  requestId: string,
): Promise<void> => {
  await apiClient.post(`/request/review/${status}/${requestId}`);
};

export const cancelRequest = async (requestId: string): Promise<void> => {
  await apiClient.delete(`/request/cancel/${requestId}`);
};
