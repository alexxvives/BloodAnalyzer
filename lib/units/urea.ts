/**
 * BUN vs urea are the same analyte reported two ways.
 *
 * US labs report blood urea nitrogen (BUN) in mg/dL.
 * Many European/Spanish labs report urea mass in mg/dL.
 * SI labs report urea in mmol/L (amount of substance — same number
 * whether labeled urea or urea nitrogen).
 *
 * urea_mg/dL ≈ BUN_mg/dL × 2.14  (urea MW 60 / nitrogen 28)
 * BUN_mg/dL ≈ urea_mmol/L × 2.8
 */

/** Conventional clinical factor (60/28 rounded the way labs cite it). */
export const UREA_MGDL_PER_BUN_MGDL = 2.14;
export const BUN_MGDL_PER_UREA_MMOL = 2.8;

export function bunFromUreaMgDl(ureaMgDl: number): number {
  return ureaMgDl / UREA_MGDL_PER_BUN_MGDL;
}

export function bunFromUreaMmolL(ureaMmolL: number): number {
  return ureaMmolL * BUN_MGDL_PER_UREA_MMOL;
}

/**
 * True when the printed assay name is European/Spanish urea mass,
 * not US BUN / urea nitrogen.
 */
export function isUreaMassAssayName(name: string): boolean {
  const n = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (/\bbun\b/.test(n)) return false;
  if (/urea nitrogen/.test(n)) return false;
  if (/nitrogeno ureico/.test(n)) return false;
  if (/n[\s-]?ureico/.test(n)) return false;
  if (/\burea\b/.test(n)) return true;
  return false;
}

export function isMmolUnit(unit: string): boolean {
  const u = unit.trim().toLowerCase().replace(/\s+/g, "");
  return u === "mmol/l" || u === "mmol/l." || u === "mmoll";
}
