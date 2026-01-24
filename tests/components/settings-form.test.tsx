/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/ui/toast";

describe("<SettingsForm />", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders user info and updates name", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: "u1", email: "user@example.com", name: "Updated" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const { SettingsForm } = await import("@/app/(dashboard)/settings/settings-form");

    const user = userEvent.setup();
    render(
      <ToastProvider>
        <SettingsForm
          user={{ id: "u1", email: "user@example.com", name: "Current" }}
          providers={["google"]}
        />
      </ToastProvider>
    );

    expect(screen.getByDisplayValue("user@example.com")).toBeInTheDocument();
    expect(screen.getByText(/google/i)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/name/i));
    await user.type(screen.getByLabelText(/name/i), "Updated");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("/api/user");
  });
});
