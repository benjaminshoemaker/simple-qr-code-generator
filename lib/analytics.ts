import { db } from "@/lib/db";
import { qrCodes, scanEvents } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Check if the user agent belongs to a known bot/crawler.
 */
export function isBot(userAgent: string): boolean {
  const botPatterns = /bot|crawler|spider|crawling|facebookexternalhit|whatsapp|telegram|slack|discord|preview|fetch|curl|wget|python|java|go-http|axios|node-fetch|postman/i;
  return botPatterns.test(userAgent);
}

/**
 * Hash an IP address using SHA-256 for privacy.
 * Returns a hex string of the hash.
 */
export async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Log a scan event for a QR code.
 * This function is designed to be called asynchronously and should not block the redirect.
 */
export async function logScanEvent(
  qrCodeId: string,
  country: string | undefined,
  ipHash: string
): Promise<void> {
  try {
    // Insert scan event
    await db.insert(scanEvents).values({
      qrCodeId,
      country: country || null,
      ipHash,
    });

    // Increment scan count on QR code (denormalized for fast reads)
    await db
      .update(qrCodes)
      .set({
        scanCount: sql`${qrCodes.scanCount} + 1`,
      })
      .where(eq(qrCodes.id, qrCodeId));
  } catch (error) {
    // Log error but don't throw - scan logging should never fail the redirect
    console.error("Failed to log scan event:", error);
  }
}
