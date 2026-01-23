import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { folders, qrCodes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// DELETE /api/folders/[id] - Delete a folder (moves QR codes to no-folder)
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Invalid folder ID" }, { status: 400 });
  }

  // Find existing folder
  const existingFolder = await db.query.folders.findFirst({
    where: eq(folders.id, id),
  });

  if (!existingFolder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  // Check ownership
  if (existingFolder.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Move QR codes in this folder to no-folder (set folderId to null)
  await db
    .update(qrCodes)
    .set({ folderId: null })
    .where(eq(qrCodes.folderId, id));

  // Delete folder
  await db
    .delete(folders)
    .where(and(eq(folders.id, id), eq(folders.userId, session.user.id)));

  return new NextResponse(null, { status: 204 });
}
