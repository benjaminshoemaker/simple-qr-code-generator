import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { qrCodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isBot, hashIP, logScanEvent } from "@/lib/analytics";

export const runtime = "edge";

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

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
    });
  }

  // Code is deactivated
  if (!qrCode.isActive) {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/go/${code}/gone`, {
      status: 302,
    });
  }

  // Log scan event asynchronously (don't block redirect)
  const userAgent = request.headers.get("user-agent") || "";

  // Only log human scans, filter out bots
  if (!isBot(userAgent)) {
    // Get country from Vercel geo headers (available on Vercel Edge)
    const country = request.headers.get("x-vercel-ip-country") || undefined;

    // Get IP and hash it for privacy
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

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
    },
  });
}
