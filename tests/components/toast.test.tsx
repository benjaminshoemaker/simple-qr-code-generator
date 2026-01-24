/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "@/components/ui/toast";

function Demo() {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast.success("Saved!")}>
      Trigger
    </button>
  );
}

describe("<ToastProvider />", () => {
  it("renders and shows toasts", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    expect(screen.getByText("Saved!")).toBeInTheDocument();
  });
});

