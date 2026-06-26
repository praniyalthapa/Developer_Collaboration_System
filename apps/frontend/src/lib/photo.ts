import { API_BASE_URL } from "./apiClient";

const backendOrigin = (): string => {
  if (API_BASE_URL.startsWith("http")) {
    return API_BASE_URL.replace(/\/api\/?$/, "");
  }
  return "";
};

export const resolvePhotoUrl = (photoUrl?: string | null): string => {
  if (!photoUrl) return "";
  if (photoUrl.startsWith("http") || photoUrl.startsWith("data:")) {
    return photoUrl;
  }
  if (photoUrl.startsWith("/api/uploads/")) {
    return `${backendOrigin()}${photoUrl}`;
  }
  return photoUrl;
};

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-fuchsia-500 to-purple-500",
];

export const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.charAt(0).toUpperCase() ?? "";
  const last = lastName?.charAt(0).toUpperCase() ?? "";
  return `${first}${last}` || "U";
};

export const getAvatarGradient = (seed: string): string => {
  const hash = Array.from(seed).reduce(
    (acc, char) => char.charCodeAt(0) + ((acc << 5) - acc),
    0,
  );
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};
