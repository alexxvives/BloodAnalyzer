import { describe, expect, it } from "vitest";
import { compareToPopulation } from "./population";

describe("compareToPopulation", () => {
  it("compares against sourced NHANES lipid means", () => {
    const result = compareToPopulation({
      biomarkerId: "ldl-cholesterol",
      value: 67.6,
      demographic: { sex: "male", ageYears: 27 },
    });
    expect(result.available).toBe(true);
    expect(result.benchmarkValue).toBe(111.7);
    expect(result.dataset).toMatch(/NHANES/i);
    expect(result.percentDelta).not.toBeNull();
    expect(result.direction).toBe("below");
  });

  it("compares glucose against age-/sex-stratified NHANES median", () => {
    const result = compareToPopulation({
      biomarkerId: "glucose-fasting",
      value: 92,
      demographic: { sex: "male", ageYears: 27 },
    });
    expect(result.available).toBe(true);
    expect(result.benchmarkValue).toBe(99);
    expect(result.benchmarkLabel).toBe("median");
    expect(result.dataset).toMatch(/NHANES/i);
    expect(result.direction).toBe("below");
  });

  it("compares Lp(a) against NHANES III sex-stratified median", () => {
    const result = compareToPopulation({
      biomarkerId: "lp-a",
      value: 20,
      demographic: { sex: "male", ageYears: 40 },
    });
    expect(result.available).toBe(true);
    expect(result.benchmarkValue).toBe(13);
    expect(result.benchmarkLabel).toBe("median");
  });

  it("compares neutrophil % against NHANES age-/sex median", () => {
    const result = compareToPopulation({
      biomarkerId: "neutrophils",
      value: 55,
      demographic: { sex: "male", ageYears: 27 },
    });
    expect(result.available).toBe(true);
    expect(result.benchmarkValue).toBe(55.4);
    expect(result.benchmarkLabel).toBe("median");
  });

  it("compares morning cortisol against C8 adult AM median", () => {
    const result = compareToPopulation({
      biomarkerId: "cortisol",
      value: 12,
      demographic: { sex: "male", ageYears: 27 },
    });
    expect(result.available).toBe(true);
    expect(result.benchmarkValue).toBe(14.5);
    expect(result.benchmarkLabel).toBe("median");
  });

  it("compares ESR against Alende age-/sex median", () => {
    const result = compareToPopulation({
      biomarkerId: "esr",
      value: 8,
      demographic: { sex: "male", ageYears: 27 },
    });
    expect(result.available).toBe(true);
    expect(result.benchmarkValue).toBe(4);
    expect(result.dataset).toMatch(/A-Estrada|Alende/i);
  });

  it("compares transferrin using TIBC-derived NHANES medians", () => {
    const result = compareToPopulation({
      biomarkerId: "transferrin",
      value: 280,
      demographic: { sex: "male", ageYears: 27 },
    });
    expect(result.available).toBe(true);
    expect(result.benchmarkValue).toBe(220);
    expect(result.dataset).toMatch(/TIBC/i);
  });

  it("keeps PDW without matching-unit benchmarks unavailable", () => {
    const result = compareToPopulation({
      biomarkerId: "pdw",
      value: 12,
      demographic: { sex: "male", ageYears: 27 },
    });
    expect(result.available).toBe(false);
    expect(result.percentDelta).toBeNull();
    expect(result.unavailableReason).toBe("benchmark_not_available");
  });

  it("converts /uL WBC counts before comparing to 10^3/uL medians", () => {
    const result = compareToPopulation({
      biomarkerId: "wbc",
      value: 6700,
      valueUnit: "/uL",
      demographic: { sex: "male", ageYears: 27 },
    });
    expect(result.available).toBe(true);
    expect(result.benchmarkValue).toBe(6700);
    expect(result.percentDelta).not.toBeNull();
    expect(Math.abs(result.percentDelta as number)).toBeLessThan(50);
  });

  it("does not invent absurd deltas when units would mismatch", () => {
    const broken = compareToPopulation({
      biomarkerId: "wbc",
      value: 6700,
      valueUnit: "/uL",
      demographic: { sex: "male", ageYears: 27 },
    });
    // Sanity: never report thousands-of-percent gaps for typical CBC values.
    expect(Math.abs(broken.percentDelta as number)).toBeLessThan(100);
  });

  it("returns unavailable for unknown markers", () => {
    const result = compareToPopulation({
      biomarkerId: "no-such-marker",
      value: 1,
      demographic: { sex: "female", ageYears: 40 },
    });
    expect(result.available).toBe(false);
  });
});
