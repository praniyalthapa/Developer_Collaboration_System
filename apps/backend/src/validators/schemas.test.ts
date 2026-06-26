import { describe, it, expect } from "vitest";
import { signupSchema } from "./auth.schema";
import { editProfileSchema } from "./profile.schema";
import { paginationSchema } from "./common";

describe("signup schema", () => {
  it("accepts a strong signup and lowercases the email", () => {
    const result = signupSchema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      emailId: "ADA@example.io",
      password: "Str0ng!pass",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.emailId).toBe("ada@example.io");
  });

  it("rejects a weak password", () => {
    const result = signupSchema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      emailId: "ada@example.io",
      password: "weak",
    });
    expect(result.success).toBe(false);
  });
});

describe("edit profile schema", () => {
  it("rejects fields outside the allow-list", () => {
    expect(editProfileSchema.safeParse({ emailId: "x@y.io" }).success).toBe(false);
  });

  it("accepts a partial valid update", () => {
    expect(
      editProfileSchema.safeParse({ about: "Hello", skills: ["React"] }).success,
    ).toBe(true);
  });
});

describe("pagination schema", () => {
  it("coerces string query params and applies defaults", () => {
    expect(paginationSchema.parse({ page: "2", limit: "10" })).toEqual({
      page: 2,
      limit: 10,
    });
    expect(paginationSchema.parse({})).toEqual({ page: 1, limit: 10 });
  });

  it("rejects an out-of-range limit", () => {
    expect(paginationSchema.safeParse({ limit: 999 }).success).toBe(false);
  });
});
