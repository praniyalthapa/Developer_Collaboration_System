import { apiClient, unwrap } from "../lib/apiClient";
import type { CurrentUser, Gender } from "../types/models";

export interface ProfileUpdate {
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  gender?: Gender;
  age?: number;
  about?: string;
  skills?: string[];
}

export const getProfile = async (): Promise<CurrentUser> => {
  const res = await apiClient.get<{ data: CurrentUser }>("/profile/view");
  return unwrap(res.data);
};

export const updateProfile = async (
  changes: ProfileUpdate,
): Promise<CurrentUser> => {
  const res = await apiClient.patch<{ data: CurrentUser }>(
    "/profile/edit",
    changes,
  );
  return unwrap(res.data);
};

export const deleteAccount = async (): Promise<void> => {
  await apiClient.delete("/profile/delete");
};

export const uploadProfilePhoto = async (
  file: Blob,
): Promise<CurrentUser> => {
  const form = new FormData();
  form.append("photo", file, "profile.jpg");
  const res = await apiClient.post<{ data: CurrentUser }>(
    "/upload/profile-photo",
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return unwrap(res.data);
};
