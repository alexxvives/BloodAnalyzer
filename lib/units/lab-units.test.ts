import { describe, expect, it } from "vitest";
import { convertLabValue, conversionFactor, normalizeLabUnit } from "./lab-units";

describe("lab unit conversion", () => {
  it("normalizes micro-sign variants", () => {
    expect(normalizeLabUnit("/µL")).toBe("/uL");
    expect(normalizeLabUnit("10^3/μL")).toBe("10^3/uL");
  });

  it("converts absolute /uL WBC counts into 10^3/uL population units", () => {
    expect(convertLabValue(6700, "/uL", "10^3/uL")).toBeCloseTo(6.7);
    expect(conversionFactor("/uL", "10^3/uL")).toBeCloseTo(0.001);
  });

  it("converts platelets the same way", () => {
    expect(convertLabValue(233_000, "/uL", "10^3/uL")).toBeCloseTo(233);
  });

  it("keeps matching /uL RBC values unchanged", () => {
    expect(convertLabValue(4_950_000, "/uL", "/uL")).toBe(4_950_000);
  });

  it("returns null for incompatible units", () => {
    expect(convertLabValue(100, "mg/dL", "10^3/uL")).toBeNull();
  });
});
