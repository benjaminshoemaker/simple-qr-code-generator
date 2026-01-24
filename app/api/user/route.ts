import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const updateUserSchema = z.object({
  name: z.string().max(255).nullable().optional(),
});

// PATCH /api/user - Update current user profile
export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = updateUserSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const rawName = result.data.name;
  const nameUpdate =
    typeof rawName === "string"
      ? rawName.trim() || null
      : rawName === null
        ? null
        : undefined;

  const updateData: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (nameUpdate !== undefined) {
    updateData.name = nameUpdate;
  }

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, session.user.id))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
    });

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: updated.id,
    email: updated.email,
    name: updated.name,
  });
}
