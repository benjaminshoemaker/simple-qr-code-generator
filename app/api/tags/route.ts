import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Request body schema for creating a tag
const createTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

// GET /api/tags - List user's tags
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userTags = await db
    .select()
    .from(tags)
    .where(eq(tags.userId, session.user.id))
    .orderBy(tags.name);

  return NextResponse.json({
    data: userTags.map((tag) => ({
      id: tag.id,
      name: tag.name,
    })),
  });
}

// POST /api/tags - Create a new tag
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
  const result = createTagSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { name } = result.data;

  // Create tag
  const [newTag] = await db
    .insert(tags)
    .values({
      userId: session.user.id,
      name,
    })
    .returning();

  return NextResponse.json(
    {
      id: newTag.id,
      name: newTag.name,
    },
    { status: 201 }
  );
}
