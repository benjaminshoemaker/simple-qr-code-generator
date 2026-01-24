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

// GET /api/qr/[id]/analytics/export - Export scan events as CSV
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
      userId: true,
      shortCode: true,
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

  const filename = `analytics-${qrCode.shortCode}.csv`;
  const encoder = new TextEncoder();

  const whereConditions = buildScanEventsWhereClause(id, dateRange);
  const whereSql = sql.join(whereConditions, sql` and `);

  const stream = new ReadableStream<Uint8Array>({
    start: async (controller) => {
      controller.enqueue(encoder.encode("timestamp,country\n"));

      const limit = 1000;
      let offset = 0;

      while (true) {
        const result = await db.execute<{
          scannedAt: string | Date;
          country: string | null;
        }>(sql`
          select ${scanEvents.scannedAt} as "scannedAt",
                 ${scanEvents.country} as "country"
          from ${scanEvents}
          where ${whereSql}
          order by ${scanEvents.scannedAt} asc
          limit ${limit} offset ${offset}
        `);

        const rows = result.rows;
        if (rows.length === 0) break;

        const csvChunk = rows
          .map((row) => {
            const timestamp =
              row.scannedAt instanceof Date
                ? row.scannedAt.toISOString()
                : new Date(row.scannedAt).toISOString();
            const country = row.country ?? "";
            return `${timestamp},${country}\n`;
          })
          .join("");

        controller.enqueue(encoder.encode(csvChunk));
        offset += rows.length;

        if (rows.length < limit) break;
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

