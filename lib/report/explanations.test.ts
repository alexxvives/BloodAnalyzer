import { KNOWN_BIOMARKER_IDS } from "@/lib/extraction/name-map";
import { describe, expect, it } from "vitest";
import { getBiomarkerExplanation } from "./explanations";

describe("biomarker explanations", () => {
  it("covers every catalog marker so detail panels are not empty", () => {
    const missing = KNOWN_BIOMARKER_IDS.filter(
      (id) => !getBiomarkerExplanation(id),
    );
    expect(missing, `missing explanations: ${missing.join(", ")}`).toEqual([]);
  });

  it("explains lipid ratios without diagnosing disease", () => {
    for (const id of [
      "tc-hdl-ratio",
      "ldl-hdl-ratio",
      "ldl-apo-b-ratio",
      "tg-hdl-ratio",
    ] as const) {
      const text = JSON.stringify(getBiomarkerExplanation(id));
      expect(text.length).toBeGreaterThan(80);
      expect(text.toLowerCase()).not.toMatch(/\byou have\b/);
    }
  });
});
