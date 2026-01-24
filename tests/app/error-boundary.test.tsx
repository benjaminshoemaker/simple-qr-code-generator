/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorPage from "@/app/error";

describe("app/error.tsx", () => {
  it("renders a global error boundary UI", () => {
    render(<ErrorPage error={new Error("boom")} reset={() => {}} />);
    expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});

