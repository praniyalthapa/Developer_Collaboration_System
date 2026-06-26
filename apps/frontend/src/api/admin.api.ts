import { apiClient, unwrap } from "../lib/apiClient";
import type { AdminStats, AdminUser, UserRole } from "../types/models";

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

export const getAdminStats = async (): Promise<AdminStats> => {
  const res = await apiClient.get<{ data: AdminStats }>("/admin/stats");
  return unwrap(res.data);
};

export const getAdminUsers = async (
  page = 1,
  limit = 20,
  search?: string,
): Promise<AdminUsersResponse> => {
  const res = await apiClient.get<AdminUsersResponse>("/admin/users", {
    params: { page, limit, ...(search ? { search } : {}) },
  });
  return res.data;
};

export const updateUserRole = async (
  userId: string,
  role: UserRole,
): Promise<void> => {
  await apiClient.patch(`/admin/users/${userId}/role`, { role });
};

export const deleteUser = async (userId: string): Promise<void> => {
  await apiClient.delete(`/admin/users/${userId}`);
};
