import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

const returningMock = vi.fn();
const whereMock = vi.fn(() => ({ returning: returningMock }));
const setMock = vi.fn(() => ({ where: whereMock }));
const updateMock = vi.fn(() => ({ set: setMock }));

vi.mock("@/lib/db", () => ({
  db: {
    update: updateMock,
  },
}));

describe("PATCH /api/user", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValueOnce(null);
    const { PATCH } = await import("@/app/api/user/route");
    const req = new NextRequest("http://localhost/api/user", { method: "PATCH" });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("updates the user name", async () => {
    const userId = crypto.randomUUID();
    authMock.mockResolvedValueOnce({ user: { id: userId } });
    returningMock.mockResolvedValueOnce([
      { id: userId, email: "user@example.com", name: "New Name" },
    ]);

    const { PATCH } = await import("@/app/api/user/route");
    const req = new NextRequest("http://localhost/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Name" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      id: userId,
      email: "user@example.com",
      name: "New Name",
    });
  });
});

