import { describe, expect, it } from "vitest";
import { suggestedTestsForResults } from "./related-tests";

describe("suggestedTestsForResults", () => {
  it("suggests iron panel slots when hemoglobin needs attention", () => {
    const map = suggestedTestsForResults([
      {
        id: "hemoglobin",
        name: "Hemoglobin",
        status: "attention",
        labStatus: "out_of_range",
      },
    ]);
    expect(map.get("ferritin")?.biomarkerId).toBe("ferritin");
    expect(map.get("serum-iron")).toBeTruthy();
    expect(map.get("ferritin")?.reason).toMatch(/Hemoglobin/i);
  });

  it("suggests apo-B / Lp(a) when LDL is fair", () => {
    const map = suggestedTestsForResults([
      {
        id: "ldl-cholesterol",
        name: "LDL Cholesterol",
        status: "fair",
        labStatus: "in_range",
      },
    ]);
    expect(map.has("apo-b")).toBe(true);
    expect(map.has("lp-a")).toBe(true);
  });

  it("does not suggest follow-ups for optimal markers", () => {
    const map = suggestedTestsForResults([
      {
        id: "ldl-cholesterol",
        name: "LDL Cholesterol",
        status: "optimal",
        labStatus: "in_range",
      },
    ]);
    expect(map.size).toBe(0);
  });
});
