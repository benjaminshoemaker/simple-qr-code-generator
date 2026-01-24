"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ScansByDay = { date: string; count: number };
type ScansByCountry = { country: string; count: number };

type AnalyticsResponse = {
  totalScans: number;
  scansByDay: ScansByDay[];
  scansByCountry: ScansByCountry[];
};

function getApiErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  if ("error" in data && typeof (data as { error?: unknown }).error === "string") {
    return (data as { error: string }).error;
  }

  return null;
}

function LineChart({ data }: { data: ScansByDay[] }) {
  const { points, max, width, height, padding } = useMemo(() => {
    const width = 600;
    const height = 180;
    const padding = 24;

    const max = data.reduce((acc, cur) => Math.max(acc, cur.count), 0);
    if (data.length < 2 || max <= 0) {
      return { points: "", max, width, height, padding };
    }

    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    const points = data
      .map((d, i) => {
        const x = padding + (i / (data.length - 1)) * innerWidth;
        const y = padding + (1 - d.count / max) * innerHeight;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");

    return { points, max, width, height, padding };
  }, [data]);

  return (
    <div
      data-testid="scans-line-chart"
      className="border border-gray-200 rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Scans over time
        </h3>
        <span className="text-xs text-gray-500">
          Max: {max}
        </span>
      </div>

      {data.length < 2 || max <= 0 ? (
        <div className="h-[180px] flex items-center justify-center text-sm text-gray-500 bg-gray-50 rounded-md">
          Not enough scan data to chart yet.
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[180px] bg-gray-50 rounded-md"
          role="img"
          aria-label="Scans line chart"
        >
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#e5e7eb"
            strokeWidth="2"
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#e5e7eb"
            strokeWidth="2"
          />
          <polyline
            points={points}
            fill="none"
            stroke="#111827"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
}

export function AnalyticsChart({ qrCodeId }: { qrCodeId: string }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(
    async (range?: { from?: string; to?: string }) => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (range?.from) params.set("from", range.from);
      if (range?.to) params.set("to", range.to);

      const url = `/api/qr/${qrCodeId}/analytics${
        params.size ? `?${params.toString()}` : ""
      }`;

      try {
        const response = await fetch(url);
        const data = (await response.json()) as unknown;

        if (!response.ok) {
          setError(getApiErrorMessage(data) ?? "Failed to load analytics");
          return;
        }

        setAnalytics(data as AnalyticsResponse);
      } catch {
        setError("Failed to load analytics");
      } finally {
        setIsLoading(false);
      }
    },
    [qrCodeId]
  );

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleApply = async () => {
    await fetchAnalytics({
      from: from || undefined,
      to: to || undefined,
    });
  };

  return (
    <section className="mt-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
            <p className="text-sm text-gray-600">
              Understand where and when your QR code is scanned.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[160px]">
              <label
                htmlFor={`analytics-from-${qrCodeId}`}
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                From
              </label>
              <Input
                id={`analytics-from-${qrCodeId}`}
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="min-w-[160px]">
              <label
                htmlFor={`analytics-to-${qrCodeId}`}
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                To
              </label>
              <Input
                id={`analytics-to-${qrCodeId}`}
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleApply}
              disabled={isLoading}
            >
              Apply
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {!analytics && isLoading && (
          <div className="mt-4 text-sm text-gray-500">Loading analytics…</div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total scans</p>
              <p
                data-testid="total-scans"
                className="mt-1 text-3xl font-bold text-gray-900"
              >
                {analytics ? analytics.totalScans : "—"}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Use the date filters to narrow results.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <LineChart data={analytics?.scansByDay ?? []} />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Scans by country
          </h3>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">
                    Country
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">
                    Scans
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics?.scansByCountry?.length ? (
                  analytics.scansByCountry.map((row) => (
                    <tr key={row.country}>
                      <td className="px-4 py-2 text-gray-900">{row.country}</td>
                      <td className="px-4 py-2 text-right text-gray-900">
                        {row.count}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-3 text-gray-500"
                    >
                      No scan data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
