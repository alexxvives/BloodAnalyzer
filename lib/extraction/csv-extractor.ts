import { canonicalizeUreaMarker } from "./canonicalize";
import { resolveBiomarkerId } from "./name-map";
import type { ExtractedMarker, ExtractionResult, Extractor } from "./types";

/**
 * Parses biomarker CSVs:
 * - Headered: name|biomarker|biomarkerId, value, unit
 * - EasyDraw / portal export: name, unit, value (section headers + metadata rows)
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
    const text = (await input.text()).replace(/^\uFEFF/, "");
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

    const rows = lines.map(splitCsvLine);
    const headers = rows[0]!.map((h) => h.trim().toLowerCase());
    const nameIdx = headers.findIndex((h) =>
      ["name", "biomarker", "biomarkerid", "marker", "test"].includes(h),
    );
    const valueIdx = headers.findIndex((h) =>
      ["value", "result", "resultvalue"].includes(h),
    );
    const unitIdx = headers.findIndex((h) => ["unit", "units"].includes(h));

    if (nameIdx >= 0 && valueIdx >= 0) {
      return collectFromColumns(rows, {
        nameIdx,
        valueIdx,
        unitIdx,
        nameIsId: headers[nameIdx] === "biomarkerid",
        startRow: 1,
      });
    }

    if (looksLikeNameUnitValueExport(rows)) {
      return collectFromColumns(rows, {
        nameIdx: 0,
        valueIdx: 2,
        unitIdx: 1,
        nameIsId: false,
        startRow: 0,
        skipNonResultRows: true,
      });
    }

    return {
      markers: [],
      warnings: [
        "CSV must include name/biomarker and value columns. Example: name,value,unit",
      ],
      method: "csv",
    };
  },
};

function collectFromColumns(
  rows: string[][],
  opts: {
    nameIdx: number;
    valueIdx: number;
    unitIdx: number;
    nameIsId: boolean;
    startRow: number;
    skipNonResultRows?: boolean;
  },
): ExtractionResult {
  const markers: ExtractedMarker[] = [];
  const warnings: string[] = [];

  for (let i = opts.startRow; i < rows.length; i++) {
    const cols = rows[i]!;
    const name = cols[opts.nameIdx]?.trim() ?? "";
    const rawValue = cols[opts.valueIdx]?.trim() ?? "";
    const unit = opts.unitIdx >= 0 ? (cols[opts.unitIdx]?.trim() ?? "") : "";

    if (!name) continue;
    if (opts.skipNonResultRows && isNonResultRow(name, unit, rawValue)) continue;

    const parsed = parseLabValue(rawValue);
    if (opts.skipNonResultRows && parsed.value == null) continue;

    const biomarkerId = opts.nameIsId ? name : resolveBiomarkerId(name);

    if (!biomarkerId) {
      warnings.push(`Row ${i + 1}: could not map “${name}” to a known marker.`);
    }

    const canonicalized = canonicalizeUreaMarker({
      biomarkerId,
      name,
      value: parsed.value,
      valueDisplay: parsed.valueDisplay,
      unit,
      confidence: biomarkerId && parsed.value != null ? 0.95 : 0.5,
    });
    if (canonicalized.warning) warnings.push(canonicalized.warning);
    markers.push(canonicalized.marker);
  }

  if (markers.length === 0) {
    warnings.push("No marker rows were parsed from the CSV.");
  }

  return { markers, warnings, method: "csv" };
}

/** EasyDraw / wellness-panel export: marker, unit, result (no name/value header). */
function looksLikeNameUnitValueExport(rows: string[][]): boolean {
  const preview = rows.slice(0, 8).flat().join(" ").toLowerCase();
  if (
    preview.includes("exported:") ||
    preview.includes("easydraw") ||
    /\bunit\b/.test(preview)
  ) {
    return countNameUnitValueRows(rows) >= 3;
  }
  return countNameUnitValueRows(rows) >= 5;
}

function countNameUnitValueRows(rows: string[][]): number {
  let n = 0;
  for (const cols of rows) {
    const name = cols[0]?.trim() ?? "";
    const unit = cols[1]?.trim() ?? "";
    const rawValue = cols[2]?.trim() ?? "";
    if (!name || isNonResultRow(name, unit, rawValue)) continue;
    if (parseLabValue(rawValue).value == null) continue;
    n += 1;
  }
  return n;
}

function isNonResultRow(name: string, unit: string, rawValue: string): boolean {
  if (/^exported:/i.test(name)) return true;
  if (!rawValue && !unit) return true;
  if (/health$/i.test(name) && !rawValue) return true;
  if (/^(nutritional|unit)$/i.test(name) && !rawValue) return true;
  return false;
}

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
