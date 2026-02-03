/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QrDeleteModal } from "@/components/qr/qr-delete-modal";

describe("<QrDeleteModal />", () => {
  it("does not render when closed", () => {
    render(
      <QrDeleteModal
        isOpen={false}
        isLoading={false}
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );

    expect(screen.queryByText(/delete qr code/i)).toBeNull();
  });

  it("renders confirmation content when open", () => {
    render(
      <QrDeleteModal
        isOpen
        isLoading={false}
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );

    expect(screen.getByText(/delete qr code/i)).toBeInTheDocument();
    expect(
      screen.getByText(/this action cannot be undone/i)
    ).toBeInTheDocument();
  });
});
