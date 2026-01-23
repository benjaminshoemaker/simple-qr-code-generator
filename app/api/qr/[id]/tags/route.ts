import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { qrCodes, qrCodeTags, tags } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Request body schema for adding a tag
const addTagSchema = z.object({
  tagId: z.string().uuid("Invalid tag ID"),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/qr/[id]/tags - List tags for a QR code
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

  // Find QR code and verify ownership
  const qrCode = await db.query.qrCodes.findFirst({
    where: eq(qrCodes.id, id),
  });

  if (!qrCode) {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }

  if (qrCode.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get tags for this QR code
  const qrTags = await db
    .select({
      id: tags.id,
      name: tags.name,
    })
    .from(qrCodeTags)
    .innerJoin(tags, eq(qrCodeTags.tagId, tags.id))
    .where(eq(qrCodeTags.qrCodeId, id));

  return NextResponse.json({
    data: qrTags,
  });
}

// POST /api/qr/[id]/tags - Add a tag to a QR code
export async function POST(request: NextRequest, context: RouteContext) {
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
  const result = addTagSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { tagId } = result.data;

  // Find QR code and verify ownership
  const qrCode = await db.query.qrCodes.findFirst({
    where: eq(qrCodes.id, id),
  });

  if (!qrCode) {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }

  if (qrCode.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify tag exists and belongs to user
  const tag = await db.query.tags.findFirst({
    where: and(eq(tags.id, tagId), eq(tags.userId, session.user.id)),
  });

  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  // Check if tag is already added
  const existing = await db.query.qrCodeTags.findFirst({
    where: and(eq(qrCodeTags.qrCodeId, id), eq(qrCodeTags.tagId, tagId)),
  });

  if (existing) {
    return NextResponse.json({ error: "Tag already added to this QR code" }, { status: 409 });
  }

  // Add tag to QR code
  await db.insert(qrCodeTags).values({
    qrCodeId: id,
    tagId,
  });

  return NextResponse.json(
    {
      qrCodeId: id,
      tagId,
      tagName: tag.name,
    },
    { status: 201 }
  );
}
