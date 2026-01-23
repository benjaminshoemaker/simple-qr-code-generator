import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { qrCodes, qrCodeTags } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string; tagId: string }>;
}

// DELETE /api/qr/[id]/tags/[tagId] - Remove a tag from a QR code
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, tagId } = await context.params;

  // Validate UUID formats
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id) || !uuidRegex.test(tagId)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
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

  // Remove tag from QR code
  await db
    .delete(qrCodeTags)
    .where(and(eq(qrCodeTags.qrCodeId, id), eq(qrCodeTags.tagId, tagId)));

  return new NextResponse(null, { status: 204 });
}
