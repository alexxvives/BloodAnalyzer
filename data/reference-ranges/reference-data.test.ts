import { describe, expect, it } from "vitest";
import { getPopulationDataset } from "@/data/population-stats";
import { getReferenceRange, listReferenceRanges } from "@/data/reference-ranges";
import { valueInBand } from "@/lib/scoring/bands";
import { convertLabValue } from "@/lib/units/lab-units";
import type { ReferenceRange } from "@/lib/types";

/**
 * Guards the reference-range data layer against the defect classes that a unit
 * test on scoring logic cannot see, because the bug lives in the data.
 */

const markers = listReferenceRanges();
const graded = markers.filter((m) => m.sourced);

/** Adjacent bands are authored as `max: X.999` / `min: X + 0.001`. */
const BOUNDARY_TOLERANCE = 0.0011;

/**
 * Known debt: these rows are marked `sourced: true` but their citation still
 * reads "NEEDS CLINICIAN REVIEW" and carries no URL, which contradicts the
 * first non-negotiable in AGENTS.md. They are quarantined here rather than
 * silently tolerated, so the checks below still block any *new* marker from
 * shipping in the same state. Each one should either gain a real citation or
 * flip to `sourced: false`.
 */
const AWAITING_CLINICIAN_REVIEW = new Set([
  "alt",
  "ast",
  "atypical-lymphs",
  "bands",
  "basophils",
  "cortisol",
  "crp",
  "eosinophils",
  "esr-2h",
  "folate",
  "lp-a",
  "lymphocytes",
  "mch",
  "mchc",
  "mcv",
  "metamyelocytes",
  "monocytes",
  "myelocytes",
  "neutrophils",
  "pdw",
  "platelets",
  "rdw",
  "transferrin",
  "tsh",
  "urea",
  "vitamin-b12",
  "wbc",
]);

function describeRow(range: ReferenceRange): string {
  const { sex, ageMin, ageMax } = range.demographic ?? {};
  const who = [
    sex ?? "any sex",
    ageMin != null ? `${ageMin}+` : null,
    ageMax != null ? `<=${ageMax}` : null,
  ]
    .filter(Boolean)
    .join(" ");
  return `${range.biomarkerId} (${who})`;
}

describe("reference-range data integrity", () => {
  it("gives every sourced marker at least one band", () => {
    for (const range of graded) {
      expect(range.bands.length, describeRow(range)).toBeGreaterThan(0);
    }
  });

  it("covers all values from -infinity to +infinity", () => {
    for (const range of graded) {
      const first = range.bands[0];
      const last = range.bands[range.bands.length - 1];
      expect(first.min, `${describeRow(range)} first band must be open-ended`).toBeNull();
      expect(last.max, `${describeRow(range)} last band must be open-ended`).toBeNull();
    }
  });

  it("leaves no gap between adjacent bands", () => {
    for (const range of graded) {
      for (let i = 1; i < range.bands.length; i++) {
        const prev = range.bands[i - 1];
        const current = range.bands[i];
        if (prev.max == null || current.min == null) continue;
        const gap = current.min - prev.max;
        expect(
          gap,
          `${describeRow(range)}: unscored hole between ${prev.max} and ${current.min}`,
        ).toBeLessThanOrEqual(BOUNDARY_TOLERANCE);
      }
    }
  });

  it("never overlaps two bands, which would make the later one dead code", () => {
    for (const range of graded) {
      for (let i = 1; i < range.bands.length; i++) {
        const prev = range.bands[i - 1];
        const current = range.bands[i];
        if (prev.max == null || current.min == null) continue;
        expect(
          current.min,
          `${describeRow(range)}: ${current.status} overlaps ${prev.status}`,
        ).toBeGreaterThan(prev.max);
      }
    }
  });

  it("orders bands from low to high", () => {
    for (const range of graded) {
      range.bands.forEach((band, i) => {
        if (i > 0) {
          expect(band.min, `${describeRow(range)} band ${i} must have a min`).not.toBeNull();
        }
        if (i < range.bands.length - 1) {
          expect(band.max, `${describeRow(range)} band ${i} must have a max`).not.toBeNull();
        }
      });
    }
  });

  it("cites a source for every sourced marker", () => {
    for (const range of graded) {
      expect(range.sourceRefs.length, describeRow(range)).toBeGreaterThan(0);
    }
  });

  it("cites a source with a URL for every reviewed marker", () => {
    for (const range of graded) {
      if (AWAITING_CLINICIAN_REVIEW.has(range.biomarkerId)) continue;
      const withUrl = range.sourceRefs.filter((ref) => ref.url);
      expect(
        withUrl.length,
        `${describeRow(range)} is marked sourced but no source ref has a URL`,
      ).toBeGreaterThan(0);
    }
  });

  it("does not add new markers that claim sourced:true with an unreviewed citation", () => {
    for (const range of graded) {
      if (AWAITING_CLINICIAN_REVIEW.has(range.biomarkerId)) continue;
      for (const ref of range.sourceRefs) {
        expect(
          ref.citation ?? "",
          `${describeRow(range)} claims sourced:true with an unreviewed citation`,
        ).not.toMatch(/NEEDS CLINICIAN REVIEW/i);
      }
    }
  });

  it("keeps the review backlog from growing", () => {
    const unreviewed = graded
      .filter((range) =>
        range.sourceRefs.some((ref) =>
          /NEEDS CLINICIAN REVIEW/i.test(ref.citation ?? ""),
        ),
      )
      .map((range) => range.biomarkerId);

    // Shrinking this list is the goal; growing it is a regression. Update the
    // constant when markers are reviewed, never to accommodate a new one.
    expect(new Set(unreviewed)).toEqual(AWAITING_CLINICIAN_REVIEW);
  });

  it("does not describe a range as male-specific while serving it to everyone", () => {
    for (const range of graded) {
      if (range.demographic?.sex) continue;
      for (const ref of range.sourceRefs) {
        expect(
          ref.label ?? "",
          `${describeRow(range)} has a male-derived label but no sex demographic`,
        ).not.toMatch(/\b(male|men)\b/i);
      }
    }
  });

  it("defines both sexes whenever a marker is split by sex", () => {
    const bySex = new Map<string, Set<string>>();
    for (const range of markers) {
      const sex = range.demographic?.sex;
      if (!sex) continue;
      const set = bySex.get(range.biomarkerId) ?? new Set<string>();
      set.add(sex);
      bySex.set(range.biomarkerId, set);
    }
    for (const [biomarkerId, sexes] of bySex) {
      expect(
        [...sexes].sort(),
        `${biomarkerId} is sex-split but is missing a row for one sex`,
      ).toEqual(["female", "male"]);
    }
  });

  /**
   * Reference-interval markers: only the two endpoints are sourced, so bands
   * must be attention / good / attention. Do not reintroduce invented fair or
   * optimal interiors (the old hemoglobin "optimization bands provisional"
   * pattern) or inter-lab disagreement painted as a fair tier.
   */
  const REFERENCE_INTERVAL_ONLY = new Set([
    "apo-a1",
    "c-peptide",
    "creatinine",
    "ggt",
    "hematocrit",
    "hemoglobin",
    "iron-saturation",
    "rbc",
    "serum-iron",
    "uric-acid",
  ]);

  it("uses only attention/good bands for reference-interval markers", () => {
    for (const range of graded) {
      if (!REFERENCE_INTERVAL_ONLY.has(range.biomarkerId)) continue;
      const statuses = [...new Set(range.bands.map((b) => b.status))].sort();
      expect(
        statuses,
        `${describeRow(range)} should be attention/good only; got ${statuses.join(",")}`,
      ).toEqual(["attention", "good"]);
    }
  });

  it("grades serum iron on the Mayo interval endpoints", () => {
    const female = getReferenceRange("serum-iron", {
      sex: "female",
      ageYears: 35,
    });
    const male = getReferenceRange("serum-iron", {
      sex: "male",
      ageYears: 35,
    });
    expect(female?.labLow).toBe(35);
    expect(female?.labHigh).toBe(145);
    expect(male?.labLow).toBe(50);
    expect(male?.labHigh).toBe(150);
    expect(female?.sourceRefs[0]?.label).toMatch(/Mayo/i);
    expect(
      female?.sourceRefs.some((r) =>
        /lab-specific, not population-derived/i.test(r.label ?? ""),
      ),
    ).toBe(true);
  });
});

/**
 * Markers where the median person genuinely does not grade well, and that is a
 * true finding rather than a broken range. Anything not listed here that grades
 * the median person poorly is almost certainly a demographic bug — that is how
 * the hematocrit defect (a male-only interval served to women, which graded the
 * median woman under 40 as "attention") went unnoticed.
 */
const MEDIAN_BELOW_GOOD_IS_EXPECTED: Record<string, string> = {
  "glucose-fasting":
    "Real US prediabetes prevalence — the ADA mapping (<100 normal, 100-125 impaired fasting glucose) is applied correctly and the median adult over 30 genuinely sits in the impaired band.",
  "vitamin-d":
    "The population median of 23-30 ng/mL falls in Holick 2011's insufficiency band. Retained deliberately, with the Endocrine Society's 2024 withdrawal of the 30 ng/mL threshold recorded in the marker's source refs.",
};

describe("population benchmarks grade sanely under their own demographic's range", () => {
  const stats = getPopulationDataset().stats.filter((stat) => stat.sourced);

  it("has benchmarks to check", () => {
    expect(stats.length).toBeGreaterThan(0);
  });

  it("grades each sex's own median as good or optimal", () => {
    const failures: string[] = [];

    for (const stat of stats) {
      const benchmark = stat.median ?? stat.mean;
      if (benchmark == null) continue;
      if (stat.biomarkerId in MEDIAN_BELOW_GOOD_IS_EXPECTED) continue;

      const ageYears = Math.round(
        (stat.demographic.ageMin + stat.demographic.ageMax) / 2,
      );
      const range = getReferenceRange(stat.biomarkerId, {
        sex: stat.demographic.sex,
        ageYears,
      });
      if (!range?.sourced || range.bands.length === 0) continue;

      const value = convertLabValue(benchmark, stat.unit, range.unit);
      if (value == null) continue;

      const band = range.bands.find((b) => valueInBand(value, b));
      if (!band) {
        failures.push(`${describeRow(range)}: median ${value} is unscored`);
        continue;
      }
      if (band.status !== "good" && band.status !== "optimal") {
        failures.push(
          `${describeRow(range)} ages ${stat.demographic.ageMin}-${stat.demographic.ageMax}: median ${value} ${range.unit} grades "${band.status}"`,
        );
      }
    }

    expect(failures, failures.join("\n")).toEqual([]);
  });
});
