import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { qrCodes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { buildShortUrl, isValidUrl } from "@/lib/qr";
import { checkUrlSafety } from "@/lib/safe-browsing";

// Request body schema for updating a QR code
const updateQrSchema = z.object({
  destinationUrl: z.string().min(1).optional(),
  name: z.string().max(255).optional().nullable(),
  folderId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/qr/[id] - Get a single QR code
export async function GET(request: NextRequest, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Invalid QR code ID" }, { status: 400 });
  }

  // Find QR code
  const qrCode = await db.query.qrCodes.findFirst({
    where: eq(qrCodes.id, id),
  });

  if (!qrCode) {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }

  // Check ownership
  if (qrCode.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: qrCode.id,
    shortCode: qrCode.shortCode,
    shortUrl: buildShortUrl(qrCode.shortCode),
    destinationUrl: qrCode.destinationUrl,
    name: qrCode.name,
    folderId: qrCode.folderId,
    isActive: qrCode.isActive,
    scanCount: qrCode.scanCount,
    createdAt: qrCode.createdAt.toISOString(),
    updatedAt: qrCode.updatedAt.toISOString(),
  });
}

// PATCH /api/qr/[id] - Update a QR code
export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Invalid QR code ID" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate request body
  const result = updateQrSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { destinationUrl, name, folderId, isActive } = result.data;

  // Find existing QR code
  const existingQr = await db.query.qrCodes.findFirst({
    where: eq(qrCodes.id, id),
  });

  if (!existingQr) {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }

  // Check ownership
  if (existingQr.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate destination URL if provided
  if (destinationUrl !== undefined && !isValidUrl(destinationUrl)) {
    return NextResponse.json(
      { error: "Invalid URL. Must be a valid http or https URL." },
      { status: 400 }
    );
  }

  if (destinationUrl !== undefined) {
    const safety = await checkUrlSafety(destinationUrl);
    if (!safety.safe) {
      return NextResponse.json(
        {
          error:
            "Destination URL was rejected because it appears unsafe (Google Safe Browsing).",
        },
        { status: 400 }
      );
    }
  }

  // Build update object
  const updateData: Partial<typeof qrCodes.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (destinationUrl !== undefined) {
    updateData.destinationUrl = destinationUrl;
  }
  if (name !== undefined) {
    updateData.name = name;
  }
  if (folderId !== undefined) {
    updateData.folderId = folderId;
  }
  if (isActive !== undefined) {
    updateData.isActive = isActive;
  }

  // Update QR code
  const [updatedQr] = await db
    .update(qrCodes)
    .set(updateData)
    .where(and(eq(qrCodes.id, id), eq(qrCodes.userId, session.user.id)))
    .returning();

  return NextResponse.json({
    id: updatedQr.id,
    shortCode: updatedQr.shortCode,
    shortUrl: buildShortUrl(updatedQr.shortCode),
    destinationUrl: updatedQr.destinationUrl,
    name: updatedQr.name,
    folderId: updatedQr.folderId,
    isActive: updatedQr.isActive,
    scanCount: updatedQr.scanCount,
    createdAt: updatedQr.createdAt.toISOString(),
    updatedAt: updatedQr.updatedAt.toISOString(),
  });
}

// DELETE /api/qr/[id] - Delete a QR code
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Invalid QR code ID" }, { status: 400 });
  }

  // Find existing QR code
  const existingQr = await db.query.qrCodes.findFirst({
    where: eq(qrCodes.id, id),
  });

  if (!existingQr) {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }

  // Check ownership
  if (existingQr.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete QR code
  await db
    .delete(qrCodes)
    .where(and(eq(qrCodes.id, id), eq(qrCodes.userId, session.user.id)));

  return new NextResponse(null, { status: 204 });
}
