/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/ui/toast";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("<QRCreateModal /> inline validation errors", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows field-level errors when API returns validation details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: "Validation failed",
            details: {
              fieldErrors: {
                destinationUrl: ["Destination URL is required"],
              },
            },
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    const user = userEvent.setup();
    const { QRCreateModal } = await import("@/components/qr-create-modal");
    render(
      <ToastProvider>
        <QRCreateModal
          isOpen
          onClose={() => {}}
        />
      </ToastProvider>
    );

    await user.type(screen.getByLabelText(/destination url/i), "https://example.com");
    await user.click(screen.getByRole("button", { name: /create qr code/i }));

    await waitFor(() =>
      expect(screen.getByText("Destination URL is required")).toBeInTheDocument()
    );
  });
});
