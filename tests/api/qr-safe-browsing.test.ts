import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

const requireSubscriptionMock = vi.fn();
const checkQrLimitMock = vi.fn();
class SubscriptionErrorMock extends Error {
  code: "NO_SUBSCRIPTION" | "LIMIT_REACHED";

  constructor(message: string, code: "NO_SUBSCRIPTION" | "LIMIT_REACHED") {
    super(message);
    this.name = "SubscriptionError";
    this.code = code;
  }
}
vi.mock("@/lib/subscription", () => ({
  requireSubscription: requireSubscriptionMock,
  checkQrLimit: checkQrLimitMock,
  SubscriptionError: SubscriptionErrorMock,
}));

const checkUrlSafetyMock = vi.fn();
vi.mock("@/lib/safe-browsing", () => ({
  checkUrlSafety: checkUrlSafetyMock,
}));

const generateUniqueShortCodeMock = vi.fn();
vi.mock("@/lib/qr", () => ({
  generateUniqueShortCode: generateUniqueShortCodeMock,
  buildShortUrl: (shortCode: string) => `http://localhost:3000/go/${shortCode}`,
  isValidUrl: (url: string) => url.startsWith("http://") || url.startsWith("https://"),
}));

const insertMock = vi.fn();
const updateMock = vi.fn();
const findFirstMock = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    insert: insertMock,
    update: updateMock,
    query: {
      qrCodes: {
        findFirst: findFirstMock,
      },
    },
  },
}));

describe("Safe Browsing integration", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects malicious URLs on create", async () => {
    const userId = crypto.randomUUID();
    authMock.mockResolvedValueOnce({ user: { id: userId } });
    requireSubscriptionMock.mockResolvedValueOnce({ plan: "pro" });
    checkQrLimitMock.mockResolvedValueOnce(undefined);
    checkUrlSafetyMock.mockResolvedValueOnce({ safe: false, reason: "Unsafe URL" });

    const { POST } = await import("@/app/api/qr/route");
    const request = new NextRequest("http://localhost/api/qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destinationUrl: "https://phishing.example",
        name: "Test",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/unsafe|malicious/i),
    });
    expect(generateUniqueShortCodeMock).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects malicious URLs on update", async () => {
    const userId = crypto.randomUUID();
    authMock.mockResolvedValueOnce({ user: { id: userId } });
    findFirstMock.mockResolvedValueOnce({
      id: crypto.randomUUID(),
      userId,
      shortCode: "abc123",
      destinationUrl: "https://example.com",
      name: null,
      folderId: null,
      isActive: true,
      scanCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    checkUrlSafetyMock.mockResolvedValueOnce({ safe: false, reason: "Unsafe URL" });

    const { PATCH } = await import("@/app/api/qr/[id]/route");
    const request = new NextRequest("http://localhost/api/qr/id", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destinationUrl: "https://phishing.example",
      }),
    });

    const qrId = crypto.randomUUID();
    const response = await PATCH(request, {
      params: Promise.resolve({ id: qrId }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/unsafe|malicious/i),
    });
    expect(updateMock).not.toHaveBeenCalled();
  });
});

