import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { folders, qrCodes } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// Request body schema for creating a folder
const createFolderSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
});

// GET /api/folders - List user's folders with QR count
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get folders with QR code count
  const userFolders = await db
    .select({
      id: folders.id,
      name: folders.name,
      createdAt: folders.createdAt,
      qrCount: sql<number>`(
        SELECT COUNT(*)::int
        FROM ${qrCodes}
        WHERE ${qrCodes.folderId} = ${folders.id}
      )`,
    })
    .from(folders)
    .where(eq(folders.userId, session.user.id))
    .orderBy(folders.name);

  return NextResponse.json({
    data: userFolders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      qrCount: folder.qrCount,
      createdAt: folder.createdAt.toISOString(),
    })),
  });
}

// POST /api/folders - Create a new folder
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate request body
  const result = createFolderSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { name } = result.data;

  // Create folder
  const [newFolder] = await db
    .insert(folders)
    .values({
      userId: session.user.id,
      name,
    })
    .returning();

  return NextResponse.json(
    {
      id: newFolder.id,
      name: newFolder.name,
      qrCount: 0,
      createdAt: newFolder.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
