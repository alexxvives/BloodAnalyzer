/**
 * Normalize and convert common lab count units so population benchmarks
 * can be compared to reference-range / extracted values.
 */

/** Canonical forms used for conversion lookups. */
export function normalizeLabUnit(unit: string): string {
  return unit
    .trim()
    .replace(/µ/g, "u")
    .replace(/μ/g, "u")
    .replace(/×/g, "x")
    .replace(/\s+/g, "")
    .replace(/10\^3\/ul/i, "10^3/uL")
    .replace(/10\^6\/ul/i, "10^6/uL")
    .replace(/x10\^?3\/ul/i, "10^3/uL")
    .replace(/x10\^?6\/ul/i, "10^6/uL")
    .replace(/^k\/ul$/i, "10^3/uL")
    .replace(/^m\/ul$/i, "10^6/uL")
    .replace(/^\/ul$/i, "/uL")
    .replace(/^\/mm3$/i, "/uL")
    .replace(/^\/mmc$/i, "/uL");
}

/**
 * Factor to multiply a value in `fromUnit` to express it in `toUnit`.
 * Returns null when units are incompatible or unknown.
 */
export function conversionFactor(
  fromUnit: string,
  toUnit: string,
): number | null {
  const from = normalizeLabUnit(fromUnit);
  const to = normalizeLabUnit(toUnit);
  if (!from || !to) return null;
  if (from === to) return 1;

  const fromPerUl = absolutePerUlFactor(from);
  const toPerUl = absolutePerUlFactor(to);
  if (fromPerUl != null && toPerUl != null) {
    return fromPerUl / toPerUl;
  }

  return null;
}

/** How many absolute cells per µL one unit of this count represents. */
function absolutePerUlFactor(unit: string): number | null {
  if (unit === "/uL") return 1;
  if (unit === "10^3/uL") return 1_000;
  if (unit === "10^6/uL") return 1_000_000;
  return null;
}

/**
 * Convert `value` from `fromUnit` into `toUnit`.
 * Returns null when conversion is not possible.
 */
export function convertLabValue(
  value: number,
  fromUnit: string,
  toUnit: string,
): number | null {
  const factor = conversionFactor(fromUnit, toUnit);
  if (factor == null || !Number.isFinite(value)) return null;
  return value * factor;
}
