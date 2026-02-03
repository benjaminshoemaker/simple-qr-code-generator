import { describe, it, expect } from "vitest";
import {
  getPlanPrice,
  getAnnualMonthlyEquivalent,
  PLANS,
} from "@/lib/billing";

describe("billing helpers", () => {
  it("returns the correct price for monthly vs annual", () => {
    const pro = PLANS.find((plan) => plan.id === "pro");
    expect(pro).toBeTruthy();
    expect(getPlanPrice("pro", "monthly")).toBe(5);
    expect(getPlanPrice("pro", "annual")).toBe(36);
  });

  it("calculates monthly equivalent for annual pricing", () => {
    expect(getAnnualMonthlyEquivalent(120)).toBe("10");
  });
});
