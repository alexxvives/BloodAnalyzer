import type { BiomarkerStatus, ReferenceRangeBand } from "@/lib/types";

/** True when value falls within [min, max], treating null as unbounded. */
export function valueInBand(value: number, band: ReferenceRangeBand): boolean {
  if (band.min != null && value < band.min) return false;
  if (band.max != null && value > band.max) return false;
  return true;
}

/**
 * First matching band wins. Data authors should keep bands non-overlapping.
 * Returns null if no band matches.
 */
export function statusFromBands(
  value: number,
  bands: ReferenceRangeBand[],
): BiomarkerStatus | null {
  for (const band of bands) {
    if (valueInBand(value, band)) return band.status;
  }
  return null;
}
