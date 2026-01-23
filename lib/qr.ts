import { db } from "@/lib/db";
import { qrCodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SHORT_CODE_LENGTH = 8;

/**
 * Generate a random short code for QR codes.
 * Uses cryptographically secure random values.
 */
export function generateShortCode(): string {
  const array = new Uint8Array(SHORT_CODE_LENGTH);
  crypto.getRandomValues(array);

  let result = "";
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    result += CHARSET[array[i] % CHARSET.length];
  }

  return result;
}

/**
 * Generate a unique short code, checking for collisions.
 * Retries up to 5 times if collision detected.
 */
export async function generateUniqueShortCode(): Promise<string> {
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateShortCode();

    // Check if code already exists
    const existing = await db.query.qrCodes.findFirst({
      where: eq(qrCodes.shortCode, code),
      columns: { id: true },
    });

    if (!existing) {
      return code;
    }
  }

  throw new Error("Failed to generate unique short code after multiple attempts");
}

/**
 * Build the full short URL for a QR code.
 */
export function buildShortUrl(shortCode: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${baseUrl}/go/${shortCode}`;
}

/**
 * Validate a destination URL.
 * Returns true if the URL is valid, false otherwise.
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
