import { createHash } from "node:crypto";

export const getSecretRoomId = (userId: string, targetUserId: string): string =>
  createHash("sha256")
    .update([userId, targetUserId].sort().join("$"))
    .digest("hex");
