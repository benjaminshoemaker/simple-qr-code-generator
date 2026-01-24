import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

const findFirstMock = vi.fn();
const executeMock = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      qrCodes: {
        findFirst: findFirstMock,
      },
    },
    execute: executeMock,
  },
}));

describe("GET /api/qr/[id]/analytics/export", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/qr/[id]/analytics/export/route");
    const request = new NextRequest("http://localhost/api/qr/test/analytics/export");
    const response = await GET(request, {
      params: Promise.resolve({ id: crypto.randomUUID() }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for invalid QR code ID", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const { GET } = await import("@/app/api/qr/[id]/analytics/export/route");
    const request = new NextRequest("http://localhost/api/qr/not-a-uuid/analytics/export");
    const response = await GET(request, {
      params: Promise.resolve({ id: "not-a-uuid" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid QR code ID" });
  });

  it("returns 404 when QR code not found", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValueOnce(null);

    const qrId = crypto.randomUUID();
    const { GET } = await import("@/app/api/qr/[id]/analytics/export/route");
    const request = new NextRequest(`http://localhost/api/qr/${qrId}/analytics/export`);
    const response = await GET(request, {
      params: Promise.resolve({ id: qrId }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "QR code not found" });
  });

  it("returns 403 when user is not the owner", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValueOnce({
      id: crypto.randomUUID(),
      userId: "other-user",
      shortCode: "abc123",
    });

    const qrId = crypto.randomUUID();
    const { GET } = await import("@/app/api/qr/[id]/analytics/export/route");
    const request = new NextRequest(`http://localhost/api/qr/${qrId}/analytics/export`);
    const response = await GET(request, {
      params: Promise.resolve({ id: qrId }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("returns a CSV download response", async () => {
    const userId = crypto.randomUUID();
    authMock.mockResolvedValueOnce({ user: { id: userId } });
    findFirstMock.mockResolvedValueOnce({
      id: crypto.randomUUID(),
      userId,
      shortCode: "abc123",
    });

    executeMock
      .mockResolvedValueOnce({
        rows: [
          { scannedAt: "2024-01-15T10:30:00.000Z", country: "US" },
          { scannedAt: "2024-01-15T11:45:00.000Z", country: "GB" },
        ],
      })
      .mockResolvedValueOnce({ rows: [] });

    const qrId = crypto.randomUUID();
    const { GET } = await import("@/app/api/qr/[id]/analytics/export/route");
    const request = new NextRequest(
      `http://localhost/api/qr/${qrId}/analytics/export?from=2024-01-01&to=2024-01-31`
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: qrId }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain("analytics-abc123.csv");
    expect(response.body).toBeInstanceOf(ReadableStream);

    const text = await response.text();
    expect(text).toContain("timestamp,country");
    expect(text).toContain("2024-01-15T10:30:00.000Z,US");
    expect(text).toContain("2024-01-15T11:45:00.000Z,GB");
  });
});

