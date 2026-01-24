/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnalyticsChart } from "@/components/analytics-chart";

describe("<AnalyticsChart />", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders analytics UI and displays fetched totals", async () => {
    const qrCodeId = crypto.randomUUID();
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          totalScans: 10,
          scansByDay: [
            { date: "2024-01-15", count: 3 },
            { date: "2024-01-16", count: 7 },
          ],
          scansByCountry: [{ country: "US", count: 10 }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<AnalyticsChart qrCodeId={qrCodeId} />);

    expect(screen.getByRole("heading", { name: /analytics/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export csv/i })).toBeInTheDocument();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("total-scans")).toHaveTextContent("10");
    expect(screen.getByTestId("scans-line-chart")).toBeInTheDocument();
    expect(screen.getByText("US")).toBeInTheDocument();
  });

  it("applies date range filtering", async () => {
    const qrCodeId = crypto.randomUUID();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            totalScans: 0,
            scansByDay: [],
            scansByCountry: [],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            totalScans: 2,
            scansByDay: [{ date: "2024-01-15", count: 2 }],
            scansByCountry: [{ country: "GB", count: 2 }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

    vi.stubGlobal("fetch", fetchMock);

    render(<AnalyticsChart qrCodeId={qrCodeId} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const user = userEvent.setup();
    fireEvent.change(screen.getByLabelText(/from/i), { target: { value: "2024-01-01" } });
    fireEvent.change(screen.getByLabelText(/to/i), { target: { value: "2024-01-31" } });

    await user.click(screen.getByRole("button", { name: /apply/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const secondUrl = String(fetchMock.mock.calls[1]?.[0]);
    expect(secondUrl).toContain(`/api/qr/${qrCodeId}/analytics`);
    expect(secondUrl).toContain("from=2024-01-01");
    expect(secondUrl).toContain("to=2024-01-31");
  });
});
