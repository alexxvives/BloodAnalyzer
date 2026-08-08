/**
 * Educational biological-age estimate from graded biomarker optimization score.
 * This is NOT Levine PhenoAge, epigenetic age, or a clinical diagnostic tool.
 */

export type BiologicalAgeEstimate = {
  available: boolean;
  chronologicalAgeYears: number;
  biologicalAgeYears: number | null;
  /** Negative = younger than chronological */
  deltaYears: number | null;
  gradedMarkerCount: number;
  optimizationPercent: number | null;
  methodId: "ba-score-v1";
  methodLabel: string;
  disclaimer: string;
};

/** Max years younger (at 100% score) or older (at 0% score) vs chronological. */
export const BIOLOGICAL_AGE_MAX_DELTA_YEARS = 12;

const METHOD_LABEL =
  "Blood Analyzer educational age estimate v1 (from graded optimization score)";

const DISCLAIMER =
  "Educational estimate only — not clinical biological age, PhenoAge, or medical advice. Discuss concerns with a clinician.";

/**
 * Maps optimization % to an age delta:
 * 100% → −MAX years, 50% → 0, 0% → +MAX years.
 * Requires at least 3 graded markers.
 */
export function estimateBiologicalAge(input: {
  chronologicalAgeYears: number;
  optimizationPercent: number | null;
  gradedMarkerCount: number;
}): BiologicalAgeEstimate {
  const { chronologicalAgeYears, optimizationPercent, gradedMarkerCount } =
    input;

  const base = {
    chronologicalAgeYears,
    gradedMarkerCount,
    optimizationPercent,
    methodId: "ba-score-v1" as const,
    methodLabel: METHOD_LABEL,
    disclaimer: DISCLAIMER,
  };

  if (
    gradedMarkerCount < 3 ||
    optimizationPercent == null ||
    !Number.isFinite(optimizationPercent) ||
    !Number.isFinite(chronologicalAgeYears)
  ) {
    return {
      ...base,
      available: false,
      biologicalAgeYears: null,
      deltaYears: null,
    };
  }

  const pct = Math.max(0, Math.min(100, optimizationPercent));
  const deltaYears =
    -((pct - 50) / 50) * BIOLOGICAL_AGE_MAX_DELTA_YEARS;
  // Reported in whole years — sub-year precision would overstate how exact
  // this educational estimate is.
  const biologicalAgeYears = Math.max(
    18,
    Math.round(chronologicalAgeYears + deltaYears),
  );
  const roundedDelta = biologicalAgeYears - Math.round(chronologicalAgeYears);

  return {
    ...base,
    available: true,
    biologicalAgeYears,
    deltaYears: roundedDelta,
  };
}
