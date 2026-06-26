import { describe, it, expect } from "vitest";
import { getSecretRoomId } from "./room";

describe("getSecretRoomId", () => {
  it("is deterministic and independent of argument order", () => {
    const a = getSecretRoomId("user-1", "user-2");
    const b = getSecretRoomId("user-2", "user-1");
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces different rooms for different pairs", () => {
    expect(getSecretRoomId("user-1", "user-2")).not.toBe(
      getSecretRoomId("user-1", "user-3"),
    );
  });
});
