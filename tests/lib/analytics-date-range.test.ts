import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {},
}));

import { buildScanEventsWhereClause, parseAnalyticsDateRange } from "@/lib/analytics";

describe("analytics date range helpers", () => {
  it("parses empty range", () => {
    expect(parseAnalyticsDateRange(null, null)).toEqual({});
  });

  it("parses a valid inclusive date range into an exclusive upper bound", () => {
    const range = parseAnalyticsDateRange("2024-01-01", "2024-01-31");
    expect(range.from?.toISOString()).toBe("2024-01-01T00:00:00.000Z");
    expect(range.toExclusive?.toISOString()).toBe("2024-02-01T00:00:00.000Z");
  });

  it("rejects invalid date formats", () => {
    expect(() => parseAnalyticsDateRange("2024/01/01", null)).toThrow(
      "Invalid date format. Expected YYYY-MM-DD."
    );
  });

  it("rejects invalid ranges", () => {
    expect(() => parseAnalyticsDateRange("2024-02-10", "2024-02-01")).toThrow(
      "Invalid date range. 'from' must be on or before 'to'."
    );
  });

  it("builds where clauses based on range params", () => {
    const id = crypto.randomUUID();

    expect(buildScanEventsWhereClause(id, parseAnalyticsDateRange(null, null))).toHaveLength(1);
    expect(buildScanEventsWhereClause(id, parseAnalyticsDateRange("2024-01-01", null))).toHaveLength(2);
    expect(buildScanEventsWhereClause(id, parseAnalyticsDateRange(null, "2024-01-01"))).toHaveLength(2);
    expect(buildScanEventsWhereClause(id, parseAnalyticsDateRange("2024-01-01", "2024-01-31"))).toHaveLength(3);
  });
});

