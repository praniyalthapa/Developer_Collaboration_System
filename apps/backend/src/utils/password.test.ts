import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "./password";

describe("password hashing", () => {
  it("hashes a password and verifies the correct one", async () => {
    const hash = await hashPassword("S3cret!pass");
    expect(hash).not.toBe("S3cret!pass");
    expect(await comparePassword("S3cret!pass", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("S3cret!pass");
    expect(await comparePassword("wrong-password", hash)).toBe(false);
  });
});
