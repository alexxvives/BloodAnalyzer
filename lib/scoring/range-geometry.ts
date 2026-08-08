import type { ReferenceRangeBand } from "@/lib/types";

export type ResolvedBand = ReferenceRangeBand & {
  min: number;
  max: number;
};

/**
 * Replace null (unbounded) ends with padded finite bounds for visualization.
 * Pure — padding is display-only and does not invent clinical cutoffs.
 */
export function resolveBandsForDisplay(
  bands: ReferenceRangeBand[],
  value: number | null,
): { bands: ResolvedBand[]; spanMin: number; spanMax: number } {
  if (bands.length === 0) {
    const center = value ?? 0;
    return {
      bands: [{ status: "good", min: center - 1, max: center + 1 }],
      spanMin: center - 1,
      spanMax: center + 1,
    };
  }

  const endpoints: number[] = [];
  for (const band of bands) {
    if (band.min != null) endpoints.push(band.min);
    if (band.max != null) endpoints.push(band.max);
  }
  if (value != null && Number.isFinite(value)) endpoints.push(value);

  if (endpoints.length === 0) {
    return {
      bands: [{ status: "good", min: 0, max: 1 }],
      spanMin: 0,
      spanMax: 1,
    };
  }

  let lo = Math.min(...endpoints);
  let hi = Math.max(...endpoints);
  const pad = Math.max((hi - lo) * 0.15, 1);

  if (bands.some((b) => b.min == null)) lo -= pad;
  if (bands.some((b) => b.max == null)) hi += pad;
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }

  const resolved: ResolvedBand[] = bands.map((band) => ({
    ...band,
    min: band.min ?? lo,
    max: band.max ?? hi,
  }));

  return {
    bands: resolved,
    spanMin: Math.min(...resolved.map((b) => b.min)),
    spanMax: Math.max(...resolved.map((b) => b.max)),
  };
}

/** 0 at bottom (low values), 1 at top (high values) — SiPhox-style vertical gauge */
export function valueToVerticalRatio(
  value: number,
  spanMin: number,
  spanMax: number,
): number {
  const t = (value - spanMin) / (spanMax - spanMin);
  return Math.min(1, Math.max(0, t));
}
