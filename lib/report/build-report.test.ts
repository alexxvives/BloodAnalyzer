import { describe, expect, it } from "vitest";
import {
  buildReportSections,
  sectionOptimizationPercent,
  sectionPopulationSummary,
  type ReportSection,
} from "./build-report";
import type { PopulationComparison } from "@/lib/scoring";
import type { Biomarker, Demographic } from "@/lib/types";

const DEMO: Demographic = { sex: "male", ageYears: 40 };

function emptyPopulation(biomarkerId = "x"): PopulationComparison {
  return {
    biomarkerId,
    available: false,
    percentDelta: null,
    direction: null,
    benchmarkValue: null,
    benchmarkLabel: null,
    dataset: null,
    sourceRefs: [],
    unavailableReason: "benchmark_not_available",
    stat: null,
  };
}

function marker(
  status: Biomarker["status"],
  population: PopulationComparison = emptyPopulation(),
): ReportSection["biomarkers"][number] {
  return {
    biomarker: {
      id: "x",
      name: "X",
      value: 1,
      unit: "u",
      status,
      labStatus: "in_range",
      range: {
        biomarkerId: "x",
        unit: "u",
        sourced: true,
        labLow: 0,
        labHigh: 10,
        bands: [],
        sourceRefs: [],
      },
      sourceRefs: [],
    },
    population,
  };
}

describe("sectionOptimizationPercent", () => {
  it("weights statuses instead of treating all good as 100%", () => {
    const section: ReportSection = {
      id: "cbc",
      title: "CBC",
      biomarkers: [marker("good"), marker("good"), marker("optimal")],
    };
    // (75 + 75 + 100) / 3 = 83.33 → 83
    expect(sectionOptimizationPercent(section)).toBe(83);
  });

  it("returns 0 when every graded marker is attention", () => {
    const section: ReportSection = {
      id: "cbc",
      title: "CBC",
      biomarkers: [marker("attention"), marker("attention")],
    };
    expect(sectionOptimizationPercent(section)).toBe(0);
  });
});

describe("sectionPopulationSummary", () => {
  it("compares optimization score to scoring the demographic means", () => {
    // Optimal LDL (<100) vs NHANES male mean ~110–120 → typical grades worse.
    const sections = buildReportSections({
      demographic: DEMO,
      markers: [
        {
          name: "LDL",
          biomarkerId: "ldl-cholesterol",
          value: 90,
          unit: "mg/dL",
          confidence: 1,
        },
        {
          name: "HDL",
          biomarkerId: "hdl-cholesterol",
          value: 65,
          unit: "mg/dL",
          confidence: 1,
        },
      ],
    });
    const lipid = sections.find((s) => s.id === "lipid");
    expect(lipid).toBeTruthy();
    const summary = sectionPopulationSummary(lipid!, DEMO);

    expect(summary.available).toBe(true);
    expect(summary.sampleSize).toBeGreaterThanOrEqual(1);
    expect(summary.userPercent).not.toBeNull();
    expect(summary.populationPercent).not.toBeNull();
    expect(summary.scoreDelta).toBe(
      (summary.userPercent as number) - (summary.populationPercent as number),
    );
    // A strong lipid panel should beat scoring the population means.
    expect(summary.scoreDelta).toBeGreaterThan(0);
    expect(summary.direction).toBe("above");
  });

  it("returns unavailable when no marker has a benchmark", () => {
    const section: ReportSection = {
      id: "lipid",
      title: "Heart Health",
      biomarkers: [marker("good"), marker("optimal")],
    };
    expect(sectionPopulationSummary(section, DEMO).available).toBe(false);
  });

  it("does not treat raw value % below average as a worse score", () => {
    // LDL well below the population mean is numerically "below avg" on the
    // old metric, but grades better — the new badge must reflect the score.
    const sections = buildReportSections({
      demographic: DEMO,
      markers: [
        {
          name: "LDL",
          biomarkerId: "ldl-cholesterol",
          value: 85,
          unit: "mg/dL",
          confidence: 1,
        },
      ],
    });
    const lipid = sections.find((s) => s.id === "lipid")!;
    const entry = lipid.biomarkers.find(
      (b) => b.biomarker.id === "ldl-cholesterol",
    )!;
    expect(entry.population.available).toBe(true);
    expect(entry.population.percentDelta).toBeLessThan(0); // value below mean
    expect(entry.biomarker.status).toBe("optimal");

    const summary = sectionPopulationSummary(lipid, DEMO);
    expect(summary.direction).toBe("above");
    expect(summary.scoreDelta).toBeGreaterThan(0);
  });
});
