import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { checkUrlSafety } from "@/lib/safe-browsing";

describe("checkUrlSafety()", () => {
  const originalKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.GOOGLE_SAFE_BROWSING_API_KEY = originalKey;
    vi.unstubAllGlobals();
  });

  it("fails open when API key is missing", async () => {
    delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkUrlSafety("https://example.com")).resolves.toEqual({
      safe: true,
      reason: "Safe Browsing not configured",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns unsafe when Safe Browsing reports a match", async () => {
    process.env.GOOGLE_SAFE_BROWSING_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                threatType: "MALWARE",
                platformType: "ANY_PLATFORM",
                threatEntryType: "URL",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    const result = await checkUrlSafety("https://phishing.example");
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/unsafe/i);
  });

  it("returns safe when Safe Browsing returns no matches", async () => {
    process.env.GOOGLE_SAFE_BROWSING_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } })
      )
    );

    await expect(checkUrlSafety("https://example.com")).resolves.toEqual({
      safe: true,
      reason: "No Safe Browsing matches",
    });
  });

  it("fails open when the API errors", async () => {
    process.env.GOOGLE_SAFE_BROWSING_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("network down")));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await checkUrlSafety("https://example.com");
    expect(result.safe).toBe(true);
    expect(result.reason).toMatch(/fail open/i);
    expect(errorSpy).toHaveBeenCalled();
  });
});

