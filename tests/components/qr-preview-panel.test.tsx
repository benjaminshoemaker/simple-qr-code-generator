/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QrPreviewPanel } from "@/components/qr/qr-preview-panel";

describe("<QrPreviewPanel />", () => {
  it("renders short URL, scan count, and disabled download buttons when no data", () => {
    render(
      <QrPreviewPanel
        shortUrl="https://example.com/go/abc123"
        scanCount={12}
        createdAt="2024-01-15T12:34:00.000Z"
        dataUrl=""
        svgString=""
        copied={false}
        onCopyUrl={() => {}}
        onDownload={() => {}}
      />
    );

    expect(screen.getByText("https://example.com/go/abc123")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PNG" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "SVG" })).toBeDisabled();
  });
});
