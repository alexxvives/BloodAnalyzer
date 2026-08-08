import { describe, expect, it } from "vitest";
import {
  BIOLOGICAL_AGE_MAX_DELTA_YEARS,
  estimateBiologicalAge,
} from "./biological-age";

describe("estimateBiologicalAge", () => {
  it("returns unavailable with fewer than 3 graded markers", () => {
    const result = estimateBiologicalAge({
      chronologicalAgeYears: 30,
      optimizationPercent: 90,
      gradedMarkerCount: 2,
    });
    expect(result.available).toBe(false);
  });

  it("is younger when score is above 50%", () => {
    const result = estimateBiologicalAge({
      chronologicalAgeYears: 30,
      optimizationPercent: 100,
      gradedMarkerCount: 8,
    });
    expect(result.available).toBe(true);
    expect(result.deltaYears).toBe(-BIOLOGICAL_AGE_MAX_DELTA_YEARS);
    expect(result.biologicalAgeYears).toBe(18);
  });

  it("matches chronological age near 50% score", () => {
    const result = estimateBiologicalAge({
      chronologicalAgeYears: 40,
      optimizationPercent: 50,
      gradedMarkerCount: 5,
    });
    expect(result.deltaYears).toBe(0);
    expect(result.biologicalAgeYears).toBe(40);
  });

  it("reports whole years even when the delta is fractional", () => {
    const result = estimateBiologicalAge({
      chronologicalAgeYears: 41,
      optimizationPercent: 63,
      gradedMarkerCount: 9,
    });
    expect(Number.isInteger(result.biologicalAgeYears)).toBe(true);
    expect(Number.isInteger(result.deltaYears)).toBe(true);
  });

  it("is older when score is below 50%", () => {
    const result = estimateBiologicalAge({
      chronologicalAgeYears: 40,
      optimizationPercent: 0,
      gradedMarkerCount: 5,
    });
    expect(result.deltaYears).toBe(BIOLOGICAL_AGE_MAX_DELTA_YEARS);
    expect(result.biologicalAgeYears).toBe(52);
  });
});
