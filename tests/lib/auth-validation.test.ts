import { describe, it, expect } from "vitest";
import { validateSignupForm } from "@/lib/auth-validation";

describe("validateSignupForm", () => {
  it("flags invalid email and weak password", () => {
    expect(
      validateSignupForm({
        email: "invalid",
        password: "short",
        confirmPassword: "short",
      })
    ).toEqual({
      email: "Please enter a valid email address",
      password: "Password must be at least 8 characters",
    });
  });

  it("flags mismatched confirmation password", () => {
    expect(
      validateSignupForm({
        email: "test@example.com",
        password: "Password1",
        confirmPassword: "Password2",
      })
    ).toEqual({
      confirmPassword: "Passwords do not match",
    });
  });

  it("accepts valid signup fields", () => {
    expect(
      validateSignupForm({
        email: "test@example.com",
        password: "Password1",
        confirmPassword: "Password1",
      })
    ).toEqual({});
  });
});
