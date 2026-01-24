import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { qrCodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isBot, hashIP, logScanEvent } from "@/lib/analytics";
import { limitRedirectByIp } from "@/lib/ratelimit";

export const runtime = "edge";

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  // Rate limit by IP (protects the redirect endpoint from abuse)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rate = await limitRedirectByIp(ip);
  const rateLimitHeaders = {
    "X-RateLimit-Limit": String(rate.limit),
    "X-RateLimit-Remaining": String(rate.remaining),
    "X-RateLimit-Reset": String(rate.reset),
  };

  if (!rate.success) {
    const retryAfterSeconds = Math.max(
      0,
      Math.ceil((rate.reset - Date.now()) / 1000)
    );

    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          ...rateLimitHeaders,
          "Retry-After": String(retryAfterSeconds),
        },
      }
    );
  }

  // Lookup QR code by short code
  const qrCode = await db.query.qrCodes.findFirst({
    where: eq(qrCodes.shortCode, code),
    columns: {
      id: true,
      destinationUrl: true,
      isActive: true,
    },
  });

  // Not found
  if (!qrCode) {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/go/${code}/not-found`, {
      status: 302,
      headers: rateLimitHeaders,
    });
  }

  // Code is deactivated
  if (!qrCode.isActive) {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/go/${code}/gone`, {
      status: 302,
      headers: rateLimitHeaders,
    });
  }

  // Log scan event asynchronously (don't block redirect)
  const userAgent = request.headers.get("user-agent") || "";

  // Only log human scans, filter out bots
  if (!isBot(userAgent)) {
    // Get country from Vercel geo headers (available on Vercel Edge)
    const country = request.headers.get("x-vercel-ip-country") || undefined;

    // Get IP and hash it for privacy
    // Fire and forget - don't await to avoid blocking redirect
    hashIP(ip).then((ipHash) => {
      logScanEvent(qrCode.id, country, ipHash).catch((error) => {
        console.error("Failed to log scan event:", error);
      });
    });
  }

  // Redirect to destination
  return NextResponse.redirect(qrCode.destinationUrl, {
    status: 302,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      ...rateLimitHeaders,
    },
  });
}
