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

describe("GET /api/qr/[id]/analytics", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/qr/[id]/analytics/route");
    const request = new NextRequest("http://localhost/api/qr/test/analytics");
    const response = await GET(request, {
      params: Promise.resolve({ id: crypto.randomUUID() }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for invalid QR code ID", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const { GET } = await import("@/app/api/qr/[id]/analytics/route");
    const request = new NextRequest("http://localhost/api/qr/not-a-uuid/analytics");
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
    const { GET } = await import("@/app/api/qr/[id]/analytics/route");
    const request = new NextRequest(`http://localhost/api/qr/${qrId}/analytics`);
    const response = await GET(request, {
      params: Promise.resolve({ id: qrId }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "QR code not found" });
  });

  it("returns 403 when user is not the owner", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValueOnce({ id: crypto.randomUUID(), userId: "other-user" });

    const qrId = crypto.randomUUID();
    const { GET } = await import("@/app/api/qr/[id]/analytics/route");
    const request = new NextRequest(`http://localhost/api/qr/${qrId}/analytics`);
    const response = await GET(request, {
      params: Promise.resolve({ id: qrId }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("returns aggregated analytics data", async () => {
    const userId = crypto.randomUUID();
    authMock.mockResolvedValueOnce({ user: { id: userId } });
    findFirstMock.mockResolvedValueOnce({ id: crypto.randomUUID(), userId });

    executeMock
      .mockResolvedValueOnce({ rows: [{ count: 142 }] })
      .mockResolvedValueOnce({
        rows: [
          { date: "2024-01-15", count: 12 },
          { date: "2024-01-16", count: 8 },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          { country: "US", count: 89 },
          { country: "GB", count: 23 },
        ],
      });

    const qrId = crypto.randomUUID();
    const { GET } = await import("@/app/api/qr/[id]/analytics/route");
    const request = new NextRequest(
      `http://localhost/api/qr/${qrId}/analytics?from=2024-01-01&to=2024-01-31`
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: qrId }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      totalScans: 142,
      scansByDay: [
        { date: "2024-01-15", count: 12 },
        { date: "2024-01-16", count: 8 },
      ],
      scansByCountry: [
        { country: "US", count: 89 },
        { country: "GB", count: 23 },
      ],
    });

    expect(executeMock).toHaveBeenCalledTimes(3);
  });

  it("returns 400 when date range is invalid", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValueOnce({ id: crypto.randomUUID(), userId: "user-1" });

    const qrId = crypto.randomUUID();
    const { GET } = await import("@/app/api/qr/[id]/analytics/route");
    const request = new NextRequest(
      `http://localhost/api/qr/${qrId}/analytics?from=2024-02-10&to=2024-02-01`
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: qrId }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid date range. 'from' must be on or before 'to'.",
    });
  });
});
