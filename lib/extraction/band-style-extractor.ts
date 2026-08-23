import { canonicalizeUreaMarker } from "./canonicalize";
import {
  CANONICAL_MARKER_NAMES,
  resolveBiomarkerId,
} from "./name-map";
import { parseLocalizedLabValue } from "./text-lab-extractor";
import type { ExtractedMarker, ExtractionResult } from "./types";

/** True when the text looks like EasyDraw / optimization-band panels. */
export function looksLikeBandStylePanel(text: string): boolean {
  const bandLines = (text.match(/\b(optimal|good|fair)\s*:/gi) ?? []).length;
  return bandLines >= 8;
}

/**
 * Parser for wellness-panel PDF text where each assay looks like:
 *
 *   LDL Cholesterol (mg/dL) optimal: 40 - 90
 *   good: 40 - 120
 *   fair: 40 - 130
 *   67.6
 *
 * Also handles a result glued onto the header line:
 *   High-Sensitivity CRP (mg/L) optimal: 0 - 1 <0.2
 */
export function extractMarkersFromBandStyleText(
  text: string,
): ExtractionResult {
  const lines = text
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const markers: ExtractedMarker[] = [];
  const seen = new Set<string>();
  const warnings: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (isBandOnlyLine(line) || isSectionOrMeta(line)) continue;

    const header = parseAssayHeader(line);
    if (!header) continue;
    // Skip calculated ratios / indexes — confirm UI should focus on base assays
    if (/\b(ratio|index)\b/i.test(header.name)) continue;

    let valueRaw = header.inlineValue;
    if (!valueRaw) {
      for (let j = i + 1; j < lines.length && j <= i + 6; j++) {
        const next = lines[j]!;
        if (isBandOnlyLine(next)) continue;
        if (isSectionOrMeta(next)) continue;
        // Page number followed by a date — skip
        if (
          /^\d{1,2}$/.test(next) &&
          j + 1 < lines.length &&
          isDateLine(lines[j + 1]!)
        ) {
          continue;
        }
        if (parseAssayHeader(next)) break;
        if (isResultToken(next)) {
          valueRaw = next;
          break;
        }
        break;
      }
    }

    if (!valueRaw) continue;
    const parsed = parseLocalizedLabValue(valueRaw);
    if (parsed.value == null && !parsed.valueDisplay) continue;

    const biomarkerId = resolveBiomarkerId(header.name);
    const key = (biomarkerId ?? header.name).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const canonicalized = canonicalizeUreaMarker({
      biomarkerId,
      name: header.name,
      value: parsed.value,
      valueDisplay:
        parsed.valueDisplay ??
        (/^[<>]/.test(valueRaw) ? valueRaw : undefined),
      unit: header.unit,
      confidence: biomarkerId ? 0.88 : 0.6,
    });

    if (canonicalized.warning) warnings.push(canonicalized.warning);

    markers.push({
      ...canonicalized.marker,
      name: canonicalized.marker.biomarkerId
        ? (CANONICAL_MARKER_NAMES[canonicalized.marker.biomarkerId] ??
          canonicalized.marker.name)
        : canonicalized.marker.name,
    });
  }

  return { markers, warnings, method: "text-lab" };
}

function parseAssayHeader(
  line: string,
): { name: string; unit: string; inlineValue?: string } | null {
  const hasBandCue = /\b(optimal|good|fair)\s*:/i.test(line);
  const unitMatches = [...line.matchAll(/\(([^)]+)\)/g)];
  const lastUnit = unitMatches.length
    ? unitMatches[unitMatches.length - 1]![1]!.trim()
    : "";
  const looksLikeUnit =
    lastUnit.length > 0 &&
    /(%|\/|uL|ul|dL|dl|L\b|l\b|mL|ml|IU|iu|U\b|ng|pg|mg|ug|µg|mmol|nmol|min|ratio)/i.test(
      lastUnit,
    );

  if (!hasBandCue && !looksLikeUnit) return null;
  // Avoid treating "good: 0 - 30" as a header
  if (isBandOnlyLine(line)) return null;

  let inlineValue: string | undefined;
  let working = line;

  const ineq = line.match(/\s([<>]=?\s*\d+(?:[.,]\d+)?)\s*$/);
  if (ineq && hasBandCue) {
    inlineValue = ineq[1]!.replace(/\s+/g, "");
    working = line.slice(0, ineq.index).trim();
  }

  working = working
    .replace(/\b(optimal|good|fair)\s*:\s*[\d.\s\-NaN,<>=]+/gi, " ")
    .replace(/\b(optimal|good|fair)\s*:/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  let name = working;
  let unit = "";
  if (looksLikeUnit) {
    const token = `(${lastUnit})`;
    const idx = working.lastIndexOf(token);
    if (idx >= 0) {
      name = working.slice(0, idx).trim();
      unit = lastUnit;
    }
  }

  name = name.replace(/[.:]+$/, "").trim();
  if (name.length < 3 || name.length > 90) return null;
  if (isSectionOrMeta(name)) return null;
  if (!/[A-Za-z]/.test(name)) return null;

  return { name, unit, inlineValue };
}

function isBandOnlyLine(line: string): boolean {
  return /^(optimal|good|fair)\s*:/i.test(line);
}

function isSectionOrMeta(line: string): boolean {
  return (
    /^(heart|metabolic|hormonal|kidney|liver|thyroid|prostate|nutritional)\s+health\b/i.test(
      line,
    ) ||
    /^(insights?|recommendations?|exported:|ranges\b|male|female)\b/i.test(
      line,
    ) ||
    isDateLine(line)
  );
}

function isDateLine(line: string): boolean {
  return /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(line);
}

function isResultToken(line: string): boolean {
  return /^(?:[<>]=?\s*)?\d+(?:[.,]\d+)?$/.test(line);
}
