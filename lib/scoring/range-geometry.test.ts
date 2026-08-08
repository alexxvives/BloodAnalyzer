import { describe, expect, it } from "vitest";
import {
  resolveBandsForDisplay,
  valueToVerticalRatio,
} from "./range-geometry";

describe("resolveBandsForDisplay", () => {
  it("pads unbounded ends for visualization without inventing clinical cutoffs", () => {
    const { bands, spanMin, spanMax } = resolveBandsForDisplay(
      [
        { status: "optimal", min: null, max: 99.999 },
        { status: "attention", min: 160, max: null },
      ],
      120,
    );
    expect(spanMin).toBeLessThan(100);
    expect(spanMax).toBeGreaterThan(160);
    expect(bands.every((b) => Number.isFinite(b.min) && Number.isFinite(b.max))).toBe(
      true,
    );
  });
});

describe("valueToVerticalRatio", () => {
  it("maps low values near 0 and high near 1", () => {
    expect(valueToVerticalRatio(0, 0, 100)).toBe(0);
    expect(valueToVerticalRatio(100, 0, 100)).toBe(1);
    expect(valueToVerticalRatio(50, 0, 100)).toBe(0.5);
  });
});
