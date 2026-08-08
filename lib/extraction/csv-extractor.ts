import { resolveBiomarkerId } from "./name-map";
import type { ExtractedMarker, ExtractionResult, Extractor } from "./types";

/**
 * Parses a simple CSV of biomarker results.
 * Headers (flexible): name|biomarker|biomarkerId, value, unit
 */
export const csvExtractor: Extractor = {
  accepts({ type, name }) {
    const lower = name.toLowerCase();
    return (
      type === "text/csv" ||
      type === "application/vnd.ms-excel" ||
      lower.endsWith(".csv")
    );
  },

  async extract(input) {
    const text = await input.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return {
        markers: [],
        warnings: ["CSV appears empty — add a header row and at least one value."],
        method: "csv",
      };
    }

    const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
    const nameIdx = headers.findIndex((h) =>
      ["name", "biomarker", "biomarkerid", "marker", "test"].includes(h),
    );
    const valueIdx = headers.findIndex((h) =>
      ["value", "result", "resultvalue"].includes(h),
    );
    const unitIdx = headers.findIndex((h) => ["unit", "units"].includes(h));

    if (nameIdx < 0 || valueIdx < 0) {
      return {
        markers: [],
        warnings: [
          "CSV must include name/biomarker and value columns. Example: name,value,unit",
        ],
        method: "csv",
      };
    }

    const markers: ExtractedMarker[] = [];
    const warnings: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = splitCsvLine(lines[i]);
      const name = cols[nameIdx]?.trim() ?? "";
      if (!name) continue;

      const rawValue = cols[valueIdx]?.trim() ?? "";
      const unit = unitIdx >= 0 ? (cols[unitIdx]?.trim() ?? "") : "";
      const parsed = parseLabValue(rawValue);
      const biomarkerId =
        headers[nameIdx] === "biomarkerid"
          ? name
          : resolveBiomarkerId(name);

      if (!biomarkerId) {
        warnings.push(`Row ${i + 1}: could not map “${name}” to a known marker.`);
      }

      markers.push({
        biomarkerId,
        name,
        value: parsed.value,
        valueDisplay: parsed.valueDisplay,
        unit,
        confidence: biomarkerId && parsed.value != null ? 0.95 : 0.5,
      });
    }

    if (markers.length === 0) {
      warnings.push("No marker rows were parsed from the CSV.");
    }

    return { markers, warnings, method: "csv" };
  },
};

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current);
  return result;
}

export function parseLabValue(raw: string): {
  value: number | null;
  valueDisplay?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { value: null };

  const inequality = trimmed.match(/^(<|>|<=|>=)\s*([\d.]+)/);
  if (inequality) {
    const n = Number(inequality[2]);
    return {
      value: Number.isFinite(n) ? n : null,
      valueDisplay: trimmed,
    };
  }

  const n = Number(trimmed.replace(/,/g, ""));
  if (!Number.isFinite(n)) {
    return { value: null, valueDisplay: trimmed };
  }
  return { value: n };
}
