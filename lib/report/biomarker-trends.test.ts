import { describe, expect, it } from "vitest";
import { buildBiomarkerTrends } from "./biomarker-trends";

describe("buildBiomarkerTrends", () => {
  it("orders points oldest to newest and computes delta", () => {
    const trends = buildBiomarkerTrends([
      {
        report: {
          id: "r2",
          userId: "u1",
          sourceFileKey: null,
          sourceFileName: "b.csv",
          collectedAt: null,
          demographicSex: "male",
          demographicAgeYears: 30,
          createdAt: "2026-02-01T00:00:00.000Z",
          updatedAt: "2026-02-01T00:00:00.000Z",
        },
        markers: [
          {
            id: "m2",
            reportId: "r2",
            userId: "u1",
            biomarkerId: "ldl-cholesterol",
            name: "LDL",
            value: 140,
            valueDisplay: null,
            unit: "mg/dL",
            createdAt: "2026-02-01T00:00:00.000Z",
          },
        ],
      },
      {
        report: {
          id: "r1",
          userId: "u1",
          sourceFileKey: null,
          sourceFileName: "a.csv",
          collectedAt: null,
          demographicSex: "male",
          demographicAgeYears: 30,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        markers: [
          {
            id: "m1",
            reportId: "r1",
            userId: "u1",
            biomarkerId: "ldl-cholesterol",
            name: "LDL",
            value: 160,
            valueDisplay: null,
            unit: "mg/dL",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
    ]);

    const ldl = trends.find((t) => t.biomarkerId === "ldl-cholesterol");
    expect(ldl?.points.map((p) => p.value)).toEqual([160, 140]);
    expect(ldl?.delta).toBe(-20);
  });

  it("uses collectedAt for timeline points when present", () => {
    const trends = buildBiomarkerTrends([
      {
        report: {
          id: "r1",
          userId: "u1",
          sourceFileKey: null,
          sourceFileName: "a.csv",
          collectedAt: "2025-06-15T12:00:00.000Z",
          demographicSex: "male",
          demographicAgeYears: 30,
          createdAt: "2026-08-01T00:00:00.000Z",
          updatedAt: "2026-08-01T00:00:00.000Z",
        },
        markers: [
          {
            id: "m1",
            reportId: "r1",
            userId: "u1",
            biomarkerId: "ldl-cholesterol",
            name: "LDL",
            value: 120,
            valueDisplay: null,
            unit: "mg/dL",
            createdAt: "2026-08-01T00:00:00.000Z",
          },
        ],
      },
    ]);

    expect(trends[0]?.points[0]?.at).toBe("2025-06-15T12:00:00.000Z");
  });

  it("keeps single-point series (one upload still shows on home)", () => {
    const trends = buildBiomarkerTrends([
      {
        report: {
          id: "r1",
          userId: "u1",
          sourceFileKey: null,
          sourceFileName: "a.csv",
          collectedAt: "2026-01-10T12:00:00.000Z",
          demographicSex: "male",
          demographicAgeYears: 30,
          createdAt: "2026-01-11T00:00:00.000Z",
          updatedAt: "2026-01-11T00:00:00.000Z",
        },
        markers: [
          {
            id: "m1",
            reportId: "r1",
            userId: "u1",
            biomarkerId: "glucose-fasting",
            name: "Glucose",
            value: 90,
            valueDisplay: null,
            unit: "mg/dL",
            createdAt: "2026-01-11T00:00:00.000Z",
          },
          {
            id: "m2",
            reportId: "r1",
            userId: "u1",
            biomarkerId: "ldl-cholesterol",
            name: "LDL",
            value: 100,
            valueDisplay: null,
            unit: "mg/dL",
            createdAt: "2026-01-11T00:00:00.000Z",
          },
        ],
      },
    ]);

    expect(trends).toHaveLength(2);
    expect(trends.every((t) => t.points.length === 1)).toBe(true);
    // lipid before metabolic per SECTION_ORDER
    expect(trends.map((t) => t.biomarkerId)).toEqual([
      "ldl-cholesterol",
      "glucose-fasting",
    ]);
  });
});
