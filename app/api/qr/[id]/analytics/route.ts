import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { qrCodes, scanEvents } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  buildScanEventsWhereClause,
  parseAnalyticsDateRange,
} from "@/lib/analytics";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/qr/[id]/analytics - Get analytics data for a QR code
export async function GET(request: NextRequest, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Invalid QR code ID" }, { status: 400 });
  }

  const qrCode = await db.query.qrCodes.findFirst({
    where: eq(qrCodes.id, id),
    columns: {
      id: true,
      userId: true,
    },
  });

  if (!qrCode) {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }

  if (qrCode.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  let dateRange;
  try {
    dateRange = parseAnalyticsDateRange(fromParam, toParam);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid query params";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const whereConditions = buildScanEventsWhereClause(id, dateRange);
  const whereSql = sql.join(whereConditions, sql` and `);

  const [totalResult, byDayResult, byCountryResult] = await Promise.all([
    db.execute<{ count: number | string }>(sql`
      select count(*)::int as count
      from ${scanEvents}
      where ${whereSql}
    `),
    db.execute<{ date: string; count: number | string }>(sql`
      select (${scanEvents.scannedAt}::date) as date, count(*)::int as count
      from ${scanEvents}
      where ${whereSql}
      group by (${scanEvents.scannedAt}::date)
      order by date asc
    `),
    db.execute<{ country: string; count: number | string }>(sql`
      select ${scanEvents.country} as country, count(*)::int as count
      from ${scanEvents}
      where ${whereSql} and ${scanEvents.country} is not null
      group by ${scanEvents.country}
      order by count desc
    `),
  ]);

  const totalScans = Number(totalResult.rows[0]?.count || 0);
  const scansByDay = byDayResult.rows.map((row) => ({
    date: String(row.date),
    count: Number(row.count),
  }));
  const scansByCountry = byCountryResult.rows.map((row) => ({
    country: String(row.country),
    count: Number(row.count),
  }));

  return NextResponse.json({
    totalScans,
    scansByDay,
    scansByCountry,
  });
}

