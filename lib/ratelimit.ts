import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

const REDIRECT_RATE_LIMIT = 100;
const REDIRECT_WINDOW = "1 m";

const isKvConfigured = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
);

const redirectRatelimit = isKvConfigured
  ? new Ratelimit({
      redis: kv,
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

  const result = await redirectRatelimit.limit(ip);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

