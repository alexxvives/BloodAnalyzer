import type { BiomarkerStatus } from "@/lib/types";
import {
  formatLabNumber,
  labDisplayScale,
  sampleMagnitudeForScale,
  toDisplayNumber,
  type LabDisplayScale,
} from "@/lib/report/format-lab-number";
import { STATUS_LABEL } from "@/lib/status-tokens";

const STATUS_ORDER: BiomarkerStatus[] = [
  "optimal",
  "good",
  "fair",
  "attention",
];

/**
 * Display-friendly band edges. Data often uses .999 as an exclusive upper bound
 * (e.g. 29.999 → show as &lt; 30).
 */
export function formatBandBound(
  value: number | null,
  side: "min" | "max",
  scale?: LabDisplayScale,
): string | null {
  if (value == null || !Number.isFinite(value)) return null;

  let display = scale ? toDisplayNumber(value, scale) : value;

  if (side === "max") {
    const floored = Math.floor(display);
    if (Math.abs(display - floored - 0.999) < 0.0015) {
      display = floored + 1;
    }
  }

  return formatLabNumber(display, {
    maximumFractionDigits: Math.abs(display) >= 100 ? 0 : 2,
  });
}

export function formatBandRange(
  min: number | null,
  max: number | null,
  unit: string,
  scale?: LabDisplayScale,
): string {
  const exclusiveMax =
    max != null &&
    Number.isFinite(max) &&
    Math.abs(max - Math.floor(max) - 0.999) < 0.0015;

  const displayUnit = scale?.unit ?? unit;
  const minLabel = formatBandBound(min, "min", scale);
  const maxLabel = formatBandBound(max, "max", scale);

  if (minLabel != null && maxLabel != null) {
    if (exclusiveMax) return `${minLabel}–<${maxLabel} ${displayUnit}`;
    return `${minLabel}–${maxLabel} ${displayUnit}`;
  }
  if (minLabel != null) return `≥ ${minLabel} ${displayUnit}`;
  if (maxLabel != null) {
    return exclusiveMax
      ? `< ${maxLabel} ${displayUnit}`
      : `≤ ${maxLabel} ${displayUnit}`;
  }
  return "see chart";
}

export function formatLabRange(
  labLow: number | null | undefined,
  labHigh: number | null | undefined,
  unit: string,
  scale?: LabDisplayScale,
): string | null {
  const displayUnit = scale?.unit ?? unit;
  if (labLow != null && labHigh != null) {
    return `${formatBandBound(labLow, "min", scale)}–${formatBandBound(labHigh, "max", scale)} ${displayUnit}`;
  }
  if (labLow != null) {
    return `≥ ${formatBandBound(labLow, "min", scale)} ${displayUnit}`;
  }
  if (labHigh != null) {
    return `≤ ${formatBandBound(labHigh, "max", scale)} ${displayUnit}`;
  }
  return null;
}

/** Scale for legend / card copy from a biomarker's raw unit + magnitude. */
export function displayScaleForMarker(input: {
  unit: string;
  value?: number | null;
  labLow?: number | null;
  labHigh?: number | null;
  bands?: Array<{ min: number | null; max: number | null }>;
}): LabDisplayScale {
  const sample = sampleMagnitudeForScale({
    value: input.value,
    labLow: input.labLow,
    labHigh: input.labHigh,
    bandEdges: (input.bands ?? []).flatMap((b) => [b.min, b.max]),
  });
  return labDisplayScale(input.unit, sample);
}

export type BandLegendRow = {
  status: BiomarkerStatus;
  label: string;
  range: string | null;
};

/** One row per status so missing bands (e.g. no "good") are explicit. */
export function buildBandLegendRows(
  bands: Array<{ status: BiomarkerStatus; min: number | null; max: number | null }>,
  unit: string,
  scale?: LabDisplayScale,
): BandLegendRow[] {
  const resolvedScale =
    scale ??
    displayScaleForMarker({
      unit,
      bands,
    });
  return STATUS_ORDER.map((status) => {
    const matches = bands.filter((b) => b.status === status);
    if (matches.length === 0) {
      return {
        status,
        label: STATUS_LABEL[status],
        range: null,
      };
    }
    return {
      status,
      label: STATUS_LABEL[status],
      range: matches
        .map((b) => formatBandRange(b.min, b.max, unit, resolvedScale))
        .join(" or "),
    };
  });
}
