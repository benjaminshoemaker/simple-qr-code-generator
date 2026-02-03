import { describe, it, expect } from "vitest";
import { validateQrCreate } from "@/lib/qr-validation";

describe("validateQrCreate", () => {
  it("requires a destination URL", () => {
    expect(validateQrCreate("")).toEqual({
      destinationUrl: "Destination URL is required",
    });
  });

  it("rejects invalid URLs", () => {
    expect(validateQrCreate("not-a-url")).toEqual({
      destinationUrl: "Please enter a valid URL",
    });
  });

  it("accepts valid URLs", () => {
    expect(validateQrCreate("https://example.com")).toEqual({});
  });
});
