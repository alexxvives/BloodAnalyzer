import { getPopulationStat } from "@/data/population-stats";
import { getReferenceRange } from "@/data/reference-ranges";
import { convertLabValue } from "@/lib/units/lab-units";
import type { Demographic, PopulationStat, SourceRef } from "@/lib/types";

/** Guard against residual unit mismatches blowing up section averages. */
const MAX_PLAUSIBLE_ABS_DELTA = 250;

export type PopulationComparison = {
  biomarkerId: string;
  available: boolean;
  /** Percent difference vs mean/median when both sides exist */
  percentDelta: number | null;
  direction: "above" | "below" | "equal" | null;
  /** Benchmark expressed in the same unit as the user value when possible */
  benchmarkValue: number | null;
  benchmarkLabel: "mean" | "median" | null;
  dataset: string | null;
  sourceRefs: SourceRef[];
  unavailableReason?:
    | "benchmark_not_available"
    | "missing_value"
    | "unit_mismatch";
  stat: PopulationStat | null;
};

/**
 * Compare a user value to a demographic population benchmark.
 * Never invents a benchmark — unsourced stats → unavailable.
 * Converts count units (e.g. /uL ↔ 10^3/uL) before computing % delta.
 */
export function compareToPopulation(input: {
  biomarkerId: string;
  value: number | null;
  demographic: Demographic;
  /** Unit of `value`; defaults to the reference-range unit when omitted */
  valueUnit?: string;
}): PopulationComparison {
  const { biomarkerId, value, demographic } = input;
  const stat = getPopulationStat(biomarkerId, demographic) ?? null;

  if (!stat || !stat.sourced) {
    return {
      biomarkerId,
      available: false,
      percentDelta: null,
      direction: null,
      benchmarkValue: null,
      benchmarkLabel: null,
      dataset: stat?.dataset ?? null,
      sourceRefs: stat?.sourceRefs ?? [],
      unavailableReason: "benchmark_not_available",
      stat,
    };
  }

  if (value == null || Number.isNaN(value)) {
    return {
      biomarkerId,
      available: false,
      percentDelta: null,
      direction: null,
      benchmarkValue: null,
      benchmarkLabel: null,
      dataset: stat.dataset,
      sourceRefs: stat.sourceRefs,
      unavailableReason: "missing_value",
      stat,
    };
  }

  const benchmarkLabel: "mean" | "median" | null =
    stat.mean != null ? "mean" : stat.median != null ? "median" : null;
  const rawBenchmark =
    benchmarkLabel === "mean"
      ? (stat.mean as number)
      : benchmarkLabel === "median"
        ? (stat.median as number)
        : null;

  if (rawBenchmark == null || rawBenchmark === 0) {
    return {
      biomarkerId,
      available: false,
      percentDelta: null,
      direction: null,
      benchmarkValue: null,
      benchmarkLabel: null,
      dataset: stat.dataset,
      sourceRefs: stat.sourceRefs,
      unavailableReason: "benchmark_not_available",
      stat,
    };
  }

  const ref = getReferenceRange(biomarkerId, demographic);
  const valueUnit = input.valueUnit || ref?.unit || stat.unit;
  const alignedValue = convertLabValue(value, valueUnit, stat.unit);
  const benchmarkInValueUnit = convertLabValue(
    rawBenchmark,
    stat.unit,
    valueUnit,
  );

  if (alignedValue == null || benchmarkInValueUnit == null) {
    // Units differ and are not convertible — do not invent a comparison.
    if (valueUnit !== stat.unit) {
      return {
        biomarkerId,
        available: false,
        percentDelta: null,
        direction: null,
        benchmarkValue: null,
        benchmarkLabel: null,
        dataset: stat.dataset,
        sourceRefs: stat.sourceRefs,
        unavailableReason: "unit_mismatch",
        stat,
      };
    }
  }

  const compareValue = alignedValue ?? value;
  const percentDelta = ((compareValue - rawBenchmark) / rawBenchmark) * 100;

  if (!Number.isFinite(percentDelta) || Math.abs(percentDelta) > MAX_PLAUSIBLE_ABS_DELTA) {
    return {
      biomarkerId,
      available: false,
      percentDelta: null,
      direction: null,
      benchmarkValue: null,
      benchmarkLabel: null,
      dataset: stat.dataset,
      sourceRefs: stat.sourceRefs,
      unavailableReason: "unit_mismatch",
      stat,
    };
  }

  const direction =
    Math.abs(percentDelta) < 0.05
      ? "equal"
      : percentDelta > 0
        ? "above"
        : "below";

  return {
    biomarkerId,
    available: true,
    percentDelta,
    direction,
    benchmarkValue: benchmarkInValueUnit ?? rawBenchmark,
    benchmarkLabel,
    dataset: stat.dataset,
    sourceRefs: stat.sourceRefs,
    stat,
  };
}
