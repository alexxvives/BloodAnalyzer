import { canonicalizeUreaMarker } from "./canonicalize";
import { CANONICAL_MARKER_NAMES, resolveBiomarkerId } from "./name-map";
import type { ExtractedMarker, ExtractionResult } from "./types";

/**
 * Heuristic parser for lab-report text (PDF text layer or OCR dump).
 * Handles English line layouts and Spanish clinic formats
 * (TEST HEADING → Resultado … value, and dotted NAME … value lines).
 */
export function extractMarkersFromLabText(text: string): ExtractionResult {
  const warnings: string[] = [];
  const markers: ExtractedMarker[] = [];
  const seen = new Set<string>();

  const normalized = text
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");

  if (!normalized.trim()) {
    return {
      markers: [],
      warnings: ["No readable text found in the document."],
      method: "text-lab",
    };
  }

  const lines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  let pendingTest: string | null = null;
  let inReferenceBlock = false;

  for (const line of lines) {
    if (isReferenceBlockStart(line)) {
      inReferenceBlock = true;
      continue;
    }
    if (inReferenceBlock) {
      if (looksLikeTestHeader(line) || isResultadoLine(line)) {
        inReferenceBlock = false;
      } else if (isInlineValueLine(line) && !isNoiseName(stripDotsPrefix(line))) {
        // Main CBC lines can appear after a prior reference block
        inReferenceBlock = false;
      } else {
        continue;
      }
    }

    if (isSkippableLine(line)) continue;

    const resultado = parseResultadoLine(line);
    if (resultado) {
      const name = pendingTest ?? "Resultado";
      if (!isNoiseName(name) && name.toLowerCase() !== "resultado") {
        pushMarker(markers, seen, warnings, {
          name,
          ...resultado,
          confidenceBoost: 0.15,
        });
      }
      continue;
    }

    const header = parseTestHeader(line);
    if (header) {
      pendingTest = header;
      continue;
    }

    const inline = parseInlineValueLine(line);
    if (inline) {
      const name = resolveContextualName(inline.name, pendingTest);
      if (isNoiseName(name) && !resolveBiomarkerId(name)) continue;
      pushMarker(markers, seen, warnings, {
        name,
        value: inline.value,
        valueDisplay: inline.valueDisplay,
        unit: inline.unit,
        confidenceBoost: 0,
      });
      // Keep pending test for following Resultado-style siblings
      if (looksLikeTestHeader(inline.name) || resolveBiomarkerId(inline.name)) {
        pendingTest = inline.name;
      }
    }
  }

  if (markers.length === 0) {
    warnings.push(
      "Could not match structured biomarker lines in the text. Try another PDF export, or enter values manually.",
    );
  }

  const unmapped = markers.filter((m) => !m.biomarkerId).length;
  if (unmapped > 0) {
    warnings.push(
      `${unmapped} marker(s) could not be mapped to known ids — assign them on the confirm screen.`,
    );
  }

  return { markers, warnings, method: "text-lab" };
}

function pushMarker(
  markers: ExtractedMarker[],
  seen: Set<string>,
  warnings: string[],
  input: {
    name: string;
    value: number;
    valueDisplay?: string;
    unit: string;
    confidenceBoost: number;
  },
) {
  const name = cleanName(input.name);
  if (!name || isNoiseName(name)) return;

  const biomarkerId = resolveBiomarkerId(name);
  // Heuristic PDF parse: only keep mapped assays. Unmapped noise (ref-range prose,
  // calendar lines) is dropped; users can still add rows manually on confirm.
  if (!biomarkerId) return;

  const key = biomarkerId ?? name.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);

  const base = biomarkerId ? 0.75 : 0.45;
  const canonicalized = canonicalizeUreaMarker({
    biomarkerId,
    name,
    value: input.value,
    valueDisplay: input.valueDisplay,
    unit: normalizeUnit(input.unit),
    confidence: Math.min(0.95, base + input.confidenceBoost),
  });
  if (canonicalized.warning) warnings.push(canonicalized.warning);

  markers.push({
    ...canonicalized.marker,
    name: displayNameFor(canonicalized.marker.name, biomarkerId),
  });
}

function resolveContextualName(name: string, pendingTest: string | null): string {
  const id = resolveBiomarkerId(name);
  if (id) return name;
  // "A la primera hora" under VSG heading
  if (/^a la (primera|segunda) hora$/i.test(name.trim()) && pendingTest) {
    return `${pendingTest} ${name}`;
  }
  return name;
}

function parseResultadoLine(line: string): {
  value: number;
  valueDisplay?: string;
  unit: string;
} | null {
  const m = line.match(
    /^Resultado\s*[.:]?\s*[.\u2026\-\s]*([<>]=?)?\s*(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+[.,]\d+|\d+)\s*(\/?[A-Za-zµμu%][A-Za-zµμu/%0-9]*)/i,
  );
  if (!m) return null;
  const parsed = parseLocalizedLabValue(`${m[1] ?? ""}${m[2]}`);
  if (parsed.value == null) return null;
  return {
    value: parsed.value,
    valueDisplay: parsed.valueDisplay,
    unit: m[3],
  };
}

function isResultadoLine(line: string): boolean {
  return /^Resultado\b/i.test(line);
}

function parseInlineValueLine(line: string): {
  name: string;
  value: number;
  valueDisplay?: string;
  unit: string;
} | null {
  // "C. Hb …" abbreviations — strip single-letter periods so names can match
  // without allowing `.` in the name class (that would eat dotted leaders).
  const prepared = line.replace(/\b([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])\.\s+/g, "$1 ");

  // NAME …… value unit [range]
  // Important: name must NOT use `.` (that eats the dotted leaders).
  const dotted = prepared.match(
    /^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s\-\/,'()]{1,70}?)\s*[.\u2026·]{2,}\s*([<>]=?)?\s*(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+[.,]\d+|\d+)\s*(\/?[A-Za-zµμu%][A-Za-zµμu/%0-9]*)/,
  );
  if (dotted) {
    const name = cleanName(dotted[1]);
    if (!name) return null;
    const parsed = parseLocalizedLabValue(`${dotted[2] ?? ""}${dotted[3]}`);
    if (parsed.value == null) return null;
    return {
      name,
      value: parsed.value,
      valueDisplay: parsed.valueDisplay,
      unit: dotted[4],
    };
  }

  // NAME: value unit  OR  NAME value unit
  const plain = prepared.match(
    /^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s\-\/,'()]{1,60}?)\s*[:.]?\s*(?:[.\u2026\-]{2,}\s*)?([<>]=?)?\s*(\d+[.,]\d+|\d+)\s*(\/?[A-Za-zµμu%][A-Za-zµμu/%0-9]*)/,
  );
  if (!plain) return null;
  const name = cleanName(plain[1]);
  if (!name || isNoiseName(name)) return null;
  const parsed = parseLocalizedLabValue(`${plain[2] ?? ""}${plain[3]}`);
  if (parsed.value == null) return null;
  return {
    name,
    value: parsed.value,
    valueDisplay: parsed.valueDisplay,
    unit: plain[4],
  };
}

function isInlineValueLine(line: string): boolean {
  return parseInlineValueLine(line) != null;
}

function parseTestHeader(line: string): string | null {
  if (isSkippableLine(line) || isResultadoLine(line)) return null;
  // Value lines also end with [ref range] — never treat those as headers.
  if (parseInlineValueLine(line)) return null;

  // "SIDEREMIA [ Srm-Hierro ... ]" or "ALT, GPT [ Srm-... ]"
  // Do not allow `.` in the name class — that eats dotted leaders + values.
  const withBracket = line.match(
    /^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s\-\/,'()]{1,70}?)\s*\[[^\]]{3,}\]\s*$/,
  );
  if (withBracket) {
    const name = cleanName(withBracket[1]);
    return name && !isNoiseName(name) ? name : null;
  }

  // "LIPOPROTEINA a (Lp-a)" — assay title without a numeric result on the line
  if (
    /^[A-ZÁÉÍÓÚÜÑ0-9][A-ZÁÉÍÓÚÜÑa-záéíóúüñ0-9\s\-\/()]{2,50}$/.test(line) &&
    !/\d/.test(line.replace(/\([^)]*\)/g, "")) &&
    !/^METODO\b/i.test(line) &&
    looksLikeAssayName(line)
  ) {
    const name = cleanName(line);
    return name && resolveBiomarkerId(name) ? name : null;
  }

  return null;
}

function looksLikeTestHeader(line: string): boolean {
  return parseTestHeader(line) != null;
}

function isReferenceBlockStart(line: string): boolean {
  return /^(valores de referencia|reference\s*(values|range|interval)|val\.?\s*ref)/i.test(
    line,
  );
}

function isSkippableLine(line: string): boolean {
  return (
    /^(paciente|prescripci[oó]n|an[aá]lisis de sangre|hemograma completo|m[eé]todo|comentario|nota\.|p[aá]gina|sr\.\/sra|easy draw|collected|reported|specimen)/i.test(
      line,
    ) ||
    /^(c\/ |barcelon|madrid|valencia|\d{2,3}\s?\d{3})/i.test(line) ||
    /^ref\.\s*\d+/i.test(line) ||
    /^ldo\./i.test(line) ||
    /p[aá]gina\s+\d+\s+de\s+\d+/i.test(line)
  );
}

function isNoiseName(name: string): boolean {
  const n = name.trim();
  if (n.length < 2 || n.length > 70) return true;
  return /^(resultado|valores de referencia|m[eé]todo|comentario|nota|p[aá]gina|paciente|adultos?|ni[nñ]os?|ni[nñ]a|hombres?|mujeres?|nivel|riesgo|deseable|elevado|sospechoso|hasta|de\b|a partir|a los|m[aá]s de|mayores de|menos de|inf\.|sup\.|r\.?\s*n\.?|basal|post|combinadas|invierno|verano|deficiencia|insuficiencia|suficiencia|bajo|moderado|alto|muy alto|la european|european|esc|eas|objetivos|reducci[oó]n|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)/i.test(
    n,
  );
}

function looksLikeAssayName(name: string): boolean {
  if (isNoiseName(name)) return false;
  if (resolveBiomarkerId(name)) return true;
  // Require a letter-heavy clinical-looking token
  const letters = (name.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) ?? []).length;
  return letters >= 3 && !/^\d/.test(name);
}

function stripDotsPrefix(line: string): string {
  return line.split(/[.…·]{2,}/)[0] ?? line;
}

function cleanName(raw: string): string {
  return raw
    .replace(/[:.]+$/, "")
    .replace(/\s*[.…·]{2,}\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*\[[^\]]*\]\s*/g, " ")
    .trim();
}

function displayNameFor(name: string, biomarkerId: string | null): string {
  if (!biomarkerId) return name;
  // Prefer canonical English labels (avoids "A la primera hora" on confirm UI)
  if (CANONICAL_MARKER_NAMES[biomarkerId]) {
    return CANONICAL_MARKER_NAMES[biomarkerId];
  }
  if (name === name.toUpperCase() && name.length > 3) {
    return name
      .toLowerCase()
      .replace(/(^|[\s\-/,])([a-zà-ü])/g, (_, p, c) => p + c.toUpperCase());
  }
  return name;
}

function normalizeUnit(unit: string): string {
  const u = unit.replace(/µ/g, "u").replace(/μ/g, "u");
  if (/^g\/dl$/i.test(u)) return "g/dL";
  if (/^mg\/dl$/i.test(u)) return "mg/dL";
  if (/^mg\/100ml$/i.test(u)) return "mg/dL";
  if (/^ug\/100ml$/i.test(u) || /^ug\/dl$/i.test(u)) return "ug/dL";
  if (/^ug\/100ml$/i.test(u)) return "ug/dL";
  if (/^(u|iu)\/l$/i.test(u)) return "U/L";
  if (/^ng\/ml$/i.test(u)) return "ng/mL";
  if (/^pg\/ml$/i.test(u)) return "pg/mL";
  if (/^umol\/l$/i.test(u)) return "umol/L";
  if (/^uu\/ml$/i.test(u) || /^uu\/ml$/i.test(u)) return "uU/mL";
  if (/^mmol\/l$/i.test(u)) return "mmol/L";
  // 1 mmc = 1 mm³ = 1 µL — absolute cell counts stay the same.
  if (/^\/mmc$/i.test(u) || /^\/mm3$/i.test(u) || /^\/mm³$/i.test(u)) {
    return "/uL";
  }
  if (/^\/ul$/i.test(u) || /^\/µl$/i.test(u) || /^\/μl$/i.test(u)) return "/uL";
  return u;
}

/** Parse EN decimals and ES thousands/decimal-comma forms used on lab PDFs. */
export function parseLocalizedLabValue(raw: string): {
  value: number | null;
  valueDisplay?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { value: null };

  const ineq = trimmed.match(/^(<=|>=|<|>)\s*(.+)$/);
  const inequality = ineq?.[1] ?? "";
  const numPart = (ineq?.[2] ?? trimmed).trim();

  let normalized = numPart;

  // 4.950.000 or 4.950.000,50
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(numPart)) {
    normalized = numPart.replace(/\./g, "").replace(",", ".");
  } else if (/^\d+,\d+$/.test(numPart)) {
    // 14,70
    normalized = numPart.replace(",", ".");
  } else if (/^\d{1,3}\.\d{3}$/.test(numPart)) {
    // Ambiguous: Spanish thousands (252.000) vs English thousandths
    // Lab counts almost always mean thousands when exactly 3 fractional digits.
    normalized = numPart.replace(".", "");
  } else {
    normalized = numPart.replace(/,/g, "");
  }

  const n = Number(normalized);
  if (!Number.isFinite(n)) {
    return { value: null, valueDisplay: trimmed };
  }

  if (inequality) {
    return { value: n, valueDisplay: `${inequality}${formatDisplay(n, numPart)}` };
  }
  return { value: n };
}

function formatDisplay(n: number, original: string): string {
  if (original.includes(",")) {
    return String(n).replace(".", ",");
  }
  return String(n);
}
