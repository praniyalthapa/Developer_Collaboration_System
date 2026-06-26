import { describe, it, expect } from "vitest";
import { signAuthToken, verifyAuthToken } from "./jwt";

describe("auth tokens", () => {
  it("round-trips the user id in the subject claim", () => {
    const token = signAuthToken("user-123");
    expect(verifyAuthToken(token).sub).toBe("user-123");
  });

  it("throws on a malformed token", () => {
    expect(() => verifyAuthToken("not-a-real-token")).toThrow();
  });
});
