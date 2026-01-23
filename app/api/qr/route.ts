import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { qrCodes } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { generateUniqueShortCode, buildShortUrl, isValidUrl } from "@/lib/qr";
import {
  requireSubscription,
  checkQrLimit,
  SubscriptionError,
} from "@/lib/subscription";

// Request body schema for creating a QR code
const createQrSchema = z.object({
  destinationUrl: z.string().min(1, "Destination URL is required"),
  name: z.string().max(255).optional(),
  folderId: z.string().uuid().optional().nullable(),
});

// GET /api/qr - List user's QR codes with pagination
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const folderId = searchParams.get("folderId");
  const offset = (page - 1) * limit;

  // Build where clause
  const whereConditions = [eq(qrCodes.userId, session.user.id)];
  if (folderId) {
    if (folderId === "null") {
      whereConditions.push(sql`${qrCodes.folderId} IS NULL`);
    } else {
      whereConditions.push(eq(qrCodes.folderId, folderId));
    }
  }

  // Get QR codes
  const codes = await db
    .select()
    .from(qrCodes)
    .where(and(...whereConditions))
    .orderBy(desc(qrCodes.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count for pagination
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(qrCodes)
    .where(and(...whereConditions));

  const total = Number(countResult[0]?.count || 0);

  // Transform response to include short URL
  const data = codes.map((code) => ({
    id: code.id,
    shortCode: code.shortCode,
    shortUrl: buildShortUrl(code.shortCode),
    destinationUrl: code.destinationUrl,
    name: code.name,
    folderId: code.folderId,
    isActive: code.isActive,
    scanCount: code.scanCount,
    createdAt: code.createdAt.toISOString(),
    updatedAt: code.updatedAt.toISOString(),
  }));

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/qr - Create a new QR code
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check subscription status
  let subscription;
  try {
    subscription = await requireSubscription(session.user.id);
  } catch (error) {
    if (error instanceof SubscriptionError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 403 }
      );
    }
    throw error;
  }

  // Check QR code limit for the plan
  try {
    await checkQrLimit(session.user.id, subscription.plan);
  } catch (error) {
    if (error instanceof SubscriptionError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 403 }
      );
    }
    throw error;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate request body
  const result = createQrSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { destinationUrl, name, folderId } = result.data;

  // Validate URL format
  if (!isValidUrl(destinationUrl)) {
    return NextResponse.json(
      { error: "Invalid URL. Must be a valid http or https URL." },
      { status: 400 }
    );
  }

  // Generate unique short code
  const shortCode = await generateUniqueShortCode();

  // Create QR code record
  const [newQrCode] = await db
    .insert(qrCodes)
    .values({
      userId: session.user.id,
      shortCode,
      destinationUrl,
      name: name || null,
      folderId: folderId || null,
    })
    .returning();

  return NextResponse.json(
    {
      id: newQrCode.id,
      shortCode: newQrCode.shortCode,
      shortUrl: buildShortUrl(newQrCode.shortCode),
      destinationUrl: newQrCode.destinationUrl,
      name: newQrCode.name,
      folderId: newQrCode.folderId,
      isActive: newQrCode.isActive,
      scanCount: newQrCode.scanCount,
      createdAt: newQrCode.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
