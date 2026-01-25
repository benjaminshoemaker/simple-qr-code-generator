import { Ratelimit, type RatelimitConfig } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import { createRedisRatelimitClient } from "@/lib/redis";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

const REDIRECT_RATE_LIMIT = 100;
const REDIRECT_WINDOW = "1 m";

const isRedisConfigured = Boolean(process.env.REDIS_URL);
const isKvConfigured = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
);

const redis: RatelimitConfig["redis"] | null =
  (isRedisConfigured
    ? createRedisRatelimitClient()
    : null) ??
  (isKvConfigured ? kv : null);

const redirectRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(REDIRECT_RATE_LIMIT, REDIRECT_WINDOW),
      prefix: "@simple-qr/redirect",
      analytics: false,
    })
  : null;

export async function limitRedirectByIp(ip: string): Promise<RateLimitResult> {
  if (!redirectRatelimit) {
    return {
      success: true,
      limit: REDIRECT_RATE_LIMIT,
      remaining: REDIRECT_RATE_LIMIT,
      reset: 0,
    };
  }

  try {
    const result = await redirectRatelimit.limit(ip);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return {
      success: true,
      limit: REDIRECT_RATE_LIMIT,
      remaining: REDIRECT_RATE_LIMIT,
      reset: 0,
    };
  }
}
