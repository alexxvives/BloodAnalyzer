import { CANONICAL_MARKER_NAMES } from "./name-map";
import type { ExtractedMarker } from "./types";
import {
  bunFromUreaMgDl,
  bunFromUreaMmolL,
  isMmolUnit,
  isUreaMassAssayName,
} from "@/lib/units/urea";

export type CanonicalizeResult = {
  marker: ExtractedMarker;
  warning?: string;
};

/**
 * Convert European urea (mg/dL mass or mmol/L) onto the canonical BUN
 * mg/dL scale used by Mayo ranges and NHANES benchmarks.
 *
 * Must run on the *printed* assay name, before display names are rewritten
 * to "BUN" — otherwise Spanish "Urea" 34 and US "BUN" 16 cannot be told apart.
 */
export function canonicalizeUreaMarker(
  marker: ExtractedMarker,
): CanonicalizeResult {
  if (marker.biomarkerId !== "urea" || marker.value == null) {
    return { marker };
  }

  const unit = marker.unit ?? "";
  const name = marker.name ?? "";

  if (isMmolUnit(unit)) {
    const bun = round1(bunFromUreaMmolL(marker.value));
    return {
      marker: {
        ...marker,
        name: CANONICAL_MARKER_NAMES.urea ?? "BUN",
        value: bun,
        unit: "mg/dL",
        valueDisplay: undefined,
      },
      warning: `Converted urea ${marker.value} mmol/L to BUN ${bun} mg/dL (× 2.8).`,
    };
  }

  if (isUreaMassAssayName(name)) {
    const bun = round1(bunFromUreaMgDl(marker.value));
    return {
      marker: {
        ...marker,
        name: CANONICAL_MARKER_NAMES.urea ?? "BUN",
        value: bun,
        unit: "mg/dL",
        valueDisplay: undefined,
      },
      warning: `Converted European urea ${marker.value} mg/dL to BUN ${bun} mg/dL (÷ 2.14). Same molecule; US labs report BUN.`,
    };
  }

  return { marker };
}

export function canonicalizeExtractedMarkers(markers: ExtractedMarker[]): {
  markers: ExtractedMarker[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const out = markers.map((marker) => {
    const result = canonicalizeUreaMarker(marker);
    if (result.warning) warnings.push(result.warning);
    return result.marker;
  });
  return { markers: out, warnings };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
