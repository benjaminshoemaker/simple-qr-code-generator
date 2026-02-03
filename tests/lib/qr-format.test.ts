import { describe, it, expect } from "vitest";
import { buildQrFilename, formatQrDate } from "@/lib/qr-format";

describe("qr-format helpers", () => {
  it("builds a descriptive filename for downloads", () => {
    expect(buildQrFilename("abc123", 1705322045000, "png")).toBe(
      "qr-code-abc123-1705322045000.png"
    );
  });

  it("formats QR dates in en-US with date and time", () => {
    const formatted = formatQrDate("2024-01-15T12:34:00.000Z");
    expect(formatted).toContain("January");
    expect(formatted).toContain("2024");
  });
});
