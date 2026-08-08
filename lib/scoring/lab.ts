import type { LabRangeStatus } from "@/lib/types";

/**
 * Lab in/out-of-range using optional low/high bounds.
 * null bound = unbounded on that side. Both null → unknown.
 */
export function labStatusFromBounds(
  value: number,
  labLow?: number | null,
  labHigh?: number | null,
): LabRangeStatus {
  if (labLow == null && labHigh == null) return "unknown";
  if (labLow != null && value < labLow) return "out_of_range";
  if (labHigh != null && value > labHigh) return "out_of_range";
  return "in_range";
}
