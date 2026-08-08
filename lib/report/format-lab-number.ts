/**
 * Display helpers for lab magnitudes. Internal scoring stays in data-layer
 * units; UI may compact absolute cell counts (e.g. 4,950,000 /uL → 4.95 ×10⁶/µL).
 */

export type LabDisplayScale = {
  /** Divide raw data-layer values by this for display */
  factor: number;
  unit: string;
};

function isPerUl(unit: string): boolean {
  const u = unit
    .trim()
    .replace(/µ/g, "u")
    .replace(/μ/g, "u")
    .replace(/\s+/g, "")
    .toLowerCase();
  return (
    u === "/ul" ||
    u === "10^3/ul" ||
    u === "10^6/ul" ||
    u === "x10^3/ul" ||
    u === "x10^6/ul" ||
    u === "k/ul" ||
    u === "m/ul"
  );
}

/**
 * Choose a compact display scale from a representative magnitude (value or
 * lab midpoint). Only remaps absolute per-µL counts.
 */
export function labDisplayScale(
  unit: string,
  sampleValue: number | null | undefined,
): LabDisplayScale {
  if (!unit || !isPerUl(unit)) {
    return { factor: 1, unit };
  }

  const u = unit
    .trim()
    .replace(/µ/g, "u")
    .replace(/μ/g, "u")
    .replace(/\s+/g, "");

  // Already in conventional scientific count units — keep as-is.
  if (/^10\^3\/uL$/i.test(u) || /^x?10\^?3\/uL$/i.test(u) || /^K\/uL$/i.test(u)) {
    return { factor: 1, unit: "×10³/µL" };
  }
  if (/^10\^6\/uL$/i.test(u) || /^x?10\^?6\/uL$/i.test(u) || /^M\/uL$/i.test(u)) {
    return { factor: 1, unit: "×10⁶/µL" };
  }

  const v = Math.abs(sampleValue ?? 0);
  if (v >= 1_000_000) {
    return { factor: 1_000_000, unit: "×10⁶/µL" };
  }
  if (v >= 1_000) {
    return { factor: 1_000, unit: "×10³/µL" };
  }
  return { factor: 1, unit };
}

export function toDisplayNumber(value: number, scale: LabDisplayScale): number {
  return value / scale.factor;
}

export function formatLabNumber(
  value: number,
  options?: { maximumFractionDigits?: number },
): string {
  if (!Number.isFinite(value)) return "—";
  const digits = options?.maximumFractionDigits ?? 2;
  const abs = Math.abs(value);

  if (Number.isInteger(value) && abs < 10_000) {
    return String(value);
  }

  if (abs >= 100 && Math.abs(value - Math.round(value)) < 1e-6) {
    return Math.round(value).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

/** Axis / tick labels — prefer short compact forms. */
export function formatLabTick(value: number): string {
  if (!Number.isFinite(value)) return "—";

  const floored = Math.floor(value);
  if (Math.abs(value - floored - 0.999) < 0.0015) {
    return formatLabNumber(floored + 1, { maximumFractionDigits: 0 });
  }

  const abs = Math.abs(value);
  if (abs >= 100) {
    return formatLabNumber(value, { maximumFractionDigits: 0 });
  }
  if (abs >= 10) {
    return formatLabNumber(value, { maximumFractionDigits: 1 });
  }
  return formatLabNumber(value, { maximumFractionDigits: 2 });
}

/** Representative magnitude from lab bounds or a measured value. */
export function sampleMagnitudeForScale(input: {
  value?: number | null;
  labLow?: number | null;
  labHigh?: number | null;
  bandEdges?: Array<number | null | undefined>;
}): number | null {
  const candidates: number[] = [];
  if (input.value != null && Number.isFinite(input.value)) {
    candidates.push(input.value);
  }
  if (input.labLow != null && Number.isFinite(input.labLow)) {
    candidates.push(input.labLow);
  }
  if (input.labHigh != null && Number.isFinite(input.labHigh)) {
    candidates.push(input.labHigh);
  }
  for (const edge of input.bandEdges ?? []) {
    if (edge != null && Number.isFinite(edge)) candidates.push(edge);
  }
  if (candidates.length === 0) return null;
  return Math.max(...candidates.map((n) => Math.abs(n)));
}
