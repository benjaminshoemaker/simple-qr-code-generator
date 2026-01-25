import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

let limitMock = vi.fn();
let capturedConstructorConfig: unknown = null;

vi.mock("@upstash/ratelimit", () => {
  class Ratelimit {
    static slidingWindow(tokens: number, window: string) {
      return { tokens, window };
    }

    constructor(config: unknown) {
      capturedConstructorConfig = config;
    }

    limit(identifier: string) {
      return limitMock(identifier);
    }
  }

  return { Ratelimit };
});

describe("lib/ratelimit with REDIS_URL", () => {
  const originalEnv = process.env;
  const originalConsoleError = console.error;

  beforeEach(() => {
    vi.resetModules();
    limitMock = vi.fn();
    capturedConstructorConfig = null;
    process.env = { ...originalEnv };
    console.error = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    console.error = originalConsoleError;
  });

  it("fails open when no Redis is configured", async () => {
    delete process.env.REDIS_URL;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;

    const { limitRedirectByIp } = await import("@/lib/ratelimit");
    const result = await limitRedirectByIp("1.2.3.4");

    expect(result).toEqual({
      success: true,
      limit: 100,
      remaining: 100,
      reset: 0,
    });
    expect(limitMock).not.toHaveBeenCalled();
  });

  it("uses the ratelimiter when REDIS_URL is set", async () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;

    limitMock.mockResolvedValueOnce({
      success: true,
      limit: 100,
      remaining: 99,
      reset: 1700000000,
    });

    const { limitRedirectByIp } = await import("@/lib/ratelimit");
    const result = await limitRedirectByIp("1.2.3.4");

    expect(limitMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      limit: 100,
      remaining: 99,
      reset: 1700000000,
    });

    expect(capturedConstructorConfig).not.toBeNull();
    const config = capturedConstructorConfig as {
      redis?: { evalsha?: unknown; eval?: unknown };
    };
    expect(
      typeof config.redis?.evalsha
    ).toBe("function");
    expect(
      typeof config.redis?.eval
    ).toBe("function");
  });

  it("fails open if Redis ratelimit throws", async () => {
    process.env.REDIS_URL = "redis://localhost:6379";

    limitMock.mockRejectedValueOnce(new Error("redis down"));

    const { limitRedirectByIp } = await import("@/lib/ratelimit");
    const result = await limitRedirectByIp("1.2.3.4");

    expect(limitMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      limit: 100,
      remaining: 100,
      reset: 0,
    });
  });
});
