import { describe, expect, it } from "vitest";
import { canonicalizeUreaMarker } from "@/lib/extraction/canonicalize";
import { extractMarkersFromLabText } from "@/lib/extraction/text-lab-extractor";
import {
  bunFromUreaMgDl,
  bunFromUreaMmolL,
  isUreaMassAssayName,
} from "./urea";

describe("urea vs BUN conversion", () => {
  it("treats urea mass names as European urea, not BUN", () => {
    expect(isUreaMassAssayName("Urea")).toBe(true);
    expect(isUreaMassAssayName("Urea sérica")).toBe(true);
    expect(isUreaMassAssayName("BUN")).toBe(false);
    expect(isUreaMassAssayName("Blood Urea Nitrogen")).toBe(false);
    expect(isUreaMassAssayName("Nitrógeno ureico")).toBe(false);
  });

  it("converts urea mg/dL onto the BUN scale (÷ 2.14)", () => {
    expect(bunFromUreaMgDl(34.24)).toBeCloseTo(16, 5);
    const result = canonicalizeUreaMarker({
      biomarkerId: "urea",
      name: "Urea",
      value: 34,
      unit: "mg/dL",
      confidence: 0.9,
    });
    expect(result.marker.value).toBeCloseTo(15.9, 5);
    expect(result.marker.unit).toBe("mg/dL");
    expect(result.marker.name).toBe("BUN");
    expect(result.warning).toMatch(/2\.14/);
  });

  it("does not convert a US BUN label", () => {
    const result = canonicalizeUreaMarker({
      biomarkerId: "urea",
      name: "BUN",
      value: 16,
      unit: "mg/dL",
      confidence: 0.9,
    });
    expect(result.marker.value).toBe(16);
    expect(result.warning).toBeUndefined();
  });

  it("converts SI urea mmol/L to BUN mg/dL (× 2.8)", () => {
    expect(bunFromUreaMmolL(5.7)).toBeCloseTo(15.96, 5);
    const result = canonicalizeUreaMarker({
      biomarkerId: "urea",
      name: "BUN",
      value: 5.7,
      unit: "mmol/L",
      confidence: 0.9,
    });
    expect(result.marker.value).toBeCloseTo(16.0, 5);
    expect(result.marker.unit).toBe("mg/dL");
  });

  it("converts a Spanish Urea line during text extraction", () => {
    const { markers, warnings } = extractMarkersFromLabText(
      "UREA ........ 34 mg/dL",
    );
    expect(markers[0]?.biomarkerId).toBe("urea");
    expect(markers[0]?.value).toBeCloseTo(15.9, 5);
    expect(markers[0]?.name).toBe("BUN");
    expect(warnings.join(" ")).toMatch(/2\.14/);
  });
});
