import { getReferenceRange } from "@/data/reference-ranges";
import type {
  BiomarkerStatus,
  Demographic,
  LabRangeStatus,
  ReferenceRange,
  SourceRef,
} from "@/lib/types";
import { statusFromBands } from "./bands";
import { labStatusFromBounds } from "./lab";

export type ScoreInput = {
  biomarkerId: string;
  value: number | null;
  demographic?: Demographic;
};

export type ScoreResult = {
  biomarkerId: string;
  value: number | null;
  /** Optimization grade; null when range unavailable or value missing */
  status: BiomarkerStatus | null;
  labStatus: LabRangeStatus;
  range: ReferenceRange | null;
  sourceRefs: SourceRef[];
  /** Honest empty state for UI — never invent a grade */
  rangeAvailable: boolean;
  unavailableReason?: "missing_value" | "range_not_available" | "no_matching_band";
};

/**
 * Pure scoring: raw value + demographic → status using the sourced data layer.
 * Unsourced or missing ranges never invent a status.
 */
export function scoreBiomarker(input: ScoreInput): ScoreResult {
  const { biomarkerId, value, demographic } = input;
  const range = getReferenceRange(biomarkerId, demographic);

  if (!range || !range.sourced) {
    return {
      biomarkerId,
      value,
      status: null,
      labStatus: "unknown",
      range: range ?? null,
      sourceRefs: range?.sourceRefs ?? [],
      rangeAvailable: false,
      unavailableReason: "range_not_available",
    };
  }

  if (value == null || Number.isNaN(value)) {
    return {
      biomarkerId,
      value: null,
      status: null,
      labStatus: "unknown",
      range,
      sourceRefs: range.sourceRefs,
      rangeAvailable: true,
      unavailableReason: "missing_value",
    };
  }

  const status = statusFromBands(value, range.bands);
  const labStatus = labStatusFromBounds(value, range.labLow, range.labHigh);

  if (status == null) {
    return {
      biomarkerId,
      value,
      status: null,
      labStatus,
      range,
      sourceRefs: range.sourceRefs,
      rangeAvailable: true,
      unavailableReason: "no_matching_band",
    };
  }

  return {
    biomarkerId,
    value,
    status,
    labStatus,
    range,
    sourceRefs: range.sourceRefs,
    rangeAvailable: true,
  };
}

export function scoreBiomarkers(
  inputs: ScoreInput[],
): ScoreResult[] {
  return inputs.map(scoreBiomarker);
}
