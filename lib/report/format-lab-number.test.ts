import { describe, expect, it } from "vitest";
import {
  formatLabTick,
  labDisplayScale,
  toDisplayNumber,
} from "./format-lab-number";

describe("labDisplayScale", () => {
  it("compacts absolute RBC /uL counts into ×10⁶/µL", () => {
    const scale = labDisplayScale("/uL", 4_950_000);
    expect(scale.factor).toBe(1_000_000);
    expect(scale.unit).toBe("×10⁶/µL");
    expect(toDisplayNumber(4_950_000, scale)).toBeCloseTo(4.95);
    expect(formatLabTick(toDisplayNumber(4_700_000, scale))).toBe("4.7");
  });

  it("compacts WBC /uL counts into ×10³/µL", () => {
    const scale = labDisplayScale("/uL", 6700);
    expect(scale.factor).toBe(1_000);
    expect(scale.unit).toBe("×10³/µL");
    expect(toDisplayNumber(6700, scale)).toBeCloseTo(6.7);
  });
});
