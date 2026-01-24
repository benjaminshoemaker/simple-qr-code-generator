import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const limitRedirectByIpMock = vi.fn();
vi.mock("@/lib/ratelimit", () => ({
  limitRedirectByIp: limitRedirectByIpMock,
}));

const findFirstMock = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      qrCodes: {
        findFirst: findFirstMock,
      },
    },
  },
}));

describe("GET /go/[code] rate limiting", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 429 with rate limit headers when exceeded", async () => {
    limitRedirectByIpMock.mockResolvedValueOnce({
      success: false,
      limit: 100,
      remaining: 0,
      reset: 1700000000,
    });

    const { GET } = await import("@/app/go/[code]/route");
    const request = new NextRequest("http://localhost/go/abc", {
      headers: {
        "x-forwarded-for": "1.2.3.4",
        "user-agent": "bot",
      },
    });

    const response = await GET(request, {
      params: Promise.resolve({ code: "abc" }),
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("x-ratelimit-limit")).toBe("100");
    expect(response.headers.get("x-ratelimit-remaining")).toBe("0");
    expect(response.headers.get("x-ratelimit-reset")).toBe("1700000000");
  });

  it("includes rate limit headers on successful redirects", async () => {
    limitRedirectByIpMock.mockResolvedValueOnce({
      success: true,
      limit: 100,
      remaining: 99,
      reset: 1700000000,
    });

    findFirstMock.mockResolvedValueOnce({
      id: crypto.randomUUID(),
      destinationUrl: "https://example.com",
      isActive: true,
    });

    const { GET } = await import("@/app/go/[code]/route");
    const request = new NextRequest("http://localhost/go/abc", {
      headers: {
        "x-forwarded-for": "1.2.3.4",
        "user-agent": "bot",
      },
    });

    const response = await GET(request, {
      params: Promise.resolve({ code: "abc" }),
    });

    expect(response.status).toBe(302);
    const location = response.headers.get("location") || "";
    expect(location.startsWith("https://example.com")).toBe(true);
    expect(response.headers.get("x-ratelimit-limit")).toBe("100");
    expect(response.headers.get("x-ratelimit-remaining")).toBe("99");
    expect(response.headers.get("x-ratelimit-reset")).toBe("1700000000");
  });
});
