import { describe, expect, it } from "vitest";
import {
  buildBandLegendRows,
  formatBandRange,
  formatLabRange,
} from "./format-bands";

describe("formatBandRange", () => {
  it("renders exclusive .999 uppers as < N", () => {
    expect(formatBandRange(null, 29.999, "mg/dL")).toBe("< 30 mg/dL");
    expect(formatBandRange(30, 49.999, "mg/dL")).toBe("30–<50 mg/dL");
  });
});

describe("buildBandLegendRows", () => {
  it("includes every status and marks missing good bands", () => {
    const rows = buildBandLegendRows(
      [
        { status: "optimal", min: null, max: 29.999 },
        { status: "fair", min: 30, max: 49.999 },
        { status: "attention", min: 50, max: null },
      ],
      "mg/dL",
    );
    expect(rows.map((r) => r.status)).toEqual([
      "optimal",
      "good",
      "fair",
      "attention",
    ]);
    expect(rows.find((r) => r.status === "good")?.range).toBeNull();
    expect(rows.find((r) => r.status === "attention")?.range).toBe(
      "≥ 50 mg/dL",
    );
  });
});

describe("formatLabRange", () => {
  it("formats one-sided lab highs", () => {
    expect(formatLabRange(null, 30, "mg/dL")).toBe("≤ 30 mg/dL");
  });
});
