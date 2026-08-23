import { groqJsonChatBody, readGroqJsonText } from "@/lib/ai/groq";
import { canonicalizeUreaMarker } from "./canonicalize";
import {
  CANONICAL_MARKER_NAMES,
  KNOWN_BIOMARKER_IDS,
  resolveBiomarkerId,
} from "./name-map";
import { parseLocalizedLabValue } from "./text-lab-extractor";
import type { ExtractedMarker, ExtractionResult } from "./types";

/** After range-noise cleanup, larger chunks + fewer calls avoids free-tier 429s. */
const MAX_CHARS_PER_CHUNK = 8_000;
const MAX_CHUNKS = 4;
const MAX_MARKERS = 120;
const MAX_RETRIES = 5;
const CHUNK_GAP_MS = 1_500;

type AiRawMarker = {
  name?: unknown;
  value?: unknown;
  valueDisplay?: unknown;
  unit?: unknown;
  biomarkerId?: unknown;
};

/**
 * LLM extraction from lab-report text (PDF text layer or OCR dump).
 * Fixed JSON schema + server-side id remapping. Confirm UI remains mandatory.
 */
export async function extractMarkersFromLabTextWithAi(
  text: string,
  options: { apiKey: string },
): Promise<ExtractionResult> {
  const cleaned = prepareTextForModel(text);
  if (!cleaned.trim()) {
    return {
      markers: [],
      warnings: ["No readable text available for AI extraction."],
      method: "pdf-ai",
    };
  }

  // Prefer health-section chunks so the model isn't flooded with range numbers.
  const chunks = packChunks(
    chunkLabText(cleaned, MAX_CHARS_PER_CHUNK),
    MAX_CHUNKS,
  );
  const warnings: string[] = [];
  const collected: ExtractedMarker[] = [];

  let rateLimited = false;
  for (let i = 0; i < chunks.length; i++) {
    if (i > 0) await sleep(rateLimited ? 8_000 : CHUNK_GAP_MS);
    const chunk = chunks[i]!;
    try {
      const raw = await callGroqExtraction(chunk, options.apiKey, {
        part: i + 1,
        parts: chunks.length,
      });
      collected.push(...normalizeAiMarkers(raw));
      rateLimited = false;
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      if (/rate limited/i.test(message)) rateLimited = true;
      warnings.push(
        `AI extraction part ${i + 1}/${chunks.length} failed: ${message}`,
      );
    }
  }

  const markers = dedupeMarkers(collected).slice(0, MAX_MARKERS);
  if (markers.length === 0) {
    warnings.push(
      rateLimited
        ? "Groq is rate-limited right now. Wait about a minute, then re-upload — or enter values manually."
        : "AI extraction returned no biomarker values. Try another export or enter values manually.",
    );
  } else if (rateLimited) {
    warnings.push(
      "Groq hit a rate limit on a later part — some markers may be missing. Wait a minute and re-upload for a full pass, or add the rest manually.",
    );
  }

  return { markers, warnings, method: "pdf-ai" };
}

export function prepareTextForModel(text: string): string {
  let t = text
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      "[redacted-email]",
    )
    .replace(/\b(?:\+?\d[\d \t().-]{7,}\d)\b/g, (match) => {
      // Spaced hyphen is a lab range (0.75 - 1.05), not a phone (555-123-4567).
      if (/\d\s+-\s+\d/.test(match)) return match;
      const digits = (match.match(/\d/g) ?? []).length;
      if (digits < 10) return match;
      return "[redacted-phone]";
    });

  // Drop narrative / coaching tails — they are not results
  t = t.replace(
    /\n\s*(Insights|Recommendations|Comments|Interpretive comments)\b[\s\S]*$/i,
    "\n",
  );

  // Strip optimization-band noise so measured values aren't buried under
  // dozens of range endpoints. Does not pick biomarkers — AI still extracts.
  t = stripRangeBandNoise(t);

  return t.trim();
}

/**
 * Remove optimal/good/fair range lines (and inline band annotations).
 * Leaves assay names + measured values for the model to read.
 */
export function stripRangeBandNoise(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (/^(optimal|good|fair)\s*:/i.test(trimmed)) return "";
      return trimmed
        .replace(/\b(optimal|good|fair)\s*:\s*[\d.\s\-NaN,<>=]+/gi, " ")
        .replace(/\b(optimal|good|fair)\s*:/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
    })
    .filter(Boolean)
    .join("\n");
}

/** Prefer section splits (Heart Health, Kidney Health, …), then size. */
export function chunkLabText(text: string, maxChars: number): string[] {
  const sectioned = splitBySections(text);
  const chunks: string[] = [];

  for (const section of sectioned) {
    if (section.length <= maxChars) {
      chunks.push(section);
      continue;
    }
    chunks.push(...chunkText(section, maxChars));
  }

  return chunks.length > 0 ? chunks : [text];
}

/** Merge tiny section chunks so we rarely exceed a few Groq calls. */
export function packChunks(chunks: string[], maxChunks: number): string[] {
  if (chunks.length <= maxChunks) return chunks;
  const target = Math.ceil(chunks.length / maxChunks);
  const packed: string[] = [];
  for (let i = 0; i < chunks.length; i += target) {
    packed.push(chunks.slice(i, i + target).join("\n\n"));
  }
  return packed;
}

export function chunkText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);
    if (end < text.length) {
      const slice = text.slice(start, end);
      const breakAt = Math.max(
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf("\n"),
      );
      if (breakAt > maxChars * 0.35) end = start + breakAt;
    }
    const piece = text.slice(start, end).trim();
    if (piece) chunks.push(piece);
    start = Math.max(end - 250, end);
  }
  return chunks;
}

function splitBySections(text: string): string[] {
  const lines = text.split("\n");
  const sections: string[] = [];
  let current: string[] = [];

  const isSectionHeader = (line: string) =>
    /^(Heart|Metabolic|Hormonal|Kidney|Liver|Thyroid|Prostate|Nutritional|Immune|Inflammation|Blood|CBC|Lipid|Vitamins?|Iron|Hormone)\s+Health\b/i.test(
      line.trim(),
    ) ||
    /^(Complete Blood Count|Lipid Panel|Metabolic Panel|Thyroid Panel)\b/i.test(
      line.trim(),
    );

  for (const line of lines) {
    if (isSectionHeader(line) && current.length > 0) {
      sections.push(current.join("\n").trim());
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) sections.push(current.join("\n").trim());

  // If we barely sectioned, fall back to whole text
  if (sections.length <= 1) return [text];
  return sections.filter(Boolean);
}

export function normalizeAiMarkers(raw: unknown): ExtractedMarker[] {
  const list = Array.isArray(raw)
    ? raw
    : raw &&
        typeof raw === "object" &&
        Array.isArray((raw as { markers?: unknown }).markers)
      ? (raw as { markers: unknown[] }).markers
      : [];

  const out: ExtractedMarker[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const o = item as AiRawMarker;
    const name = String(o.name ?? "").trim();
    if (!name || name.length < 2) continue;

    const unit = String(o.unit ?? "").trim();
    const valueDisplayRaw =
      typeof o.valueDisplay === "string" && o.valueDisplay.trim()
        ? o.valueDisplay.trim()
        : undefined;

    let value: number | null = null;
    let valueDisplay = valueDisplayRaw;

    if (typeof o.value === "number" && Number.isFinite(o.value)) {
      value = o.value;
    } else if (typeof o.value === "string" && o.value.trim()) {
      const parsed = parseLocalizedLabValue(o.value.trim());
      value = parsed.value;
      valueDisplay = valueDisplay ?? parsed.valueDisplay;
    } else if (valueDisplayRaw) {
      const parsed = parseLocalizedLabValue(valueDisplayRaw);
      value = parsed.value;
      valueDisplay = parsed.valueDisplay ?? valueDisplayRaw;
    }

    if (value == null && !valueDisplay) continue;

    const suggestedId =
      typeof o.biomarkerId === "string" ? o.biomarkerId.trim() : "";
    const known = new Set<string>(KNOWN_BIOMARKER_IDS);
    const biomarkerId =
      (suggestedId && known.has(suggestedId) ? suggestedId : null) ??
      resolveBiomarkerId(name);

    const canonicalized = canonicalizeUreaMarker({
      biomarkerId,
      name,
      value,
      valueDisplay,
      unit: normalizeAiUnit(unit),
      confidence: biomarkerId ? 0.82 : 0.55,
    });
    out.push({
      ...canonicalized.marker,
      name: canonicalized.marker.biomarkerId
        ? (CANONICAL_MARKER_NAMES[canonicalized.marker.biomarkerId] ??
          canonicalized.marker.name)
        : canonicalized.marker.name,
    });
  }
  return out;
}

function dedupeMarkers(markers: ExtractedMarker[]): ExtractedMarker[] {
  const byKey = new Map<string, ExtractedMarker>();
  for (const m of markers) {
    const key = (m.biomarkerId ?? m.name).toLowerCase();
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, m);
      continue;
    }
    const score = (x: ExtractedMarker) =>
      (x.biomarkerId ? 2 : 0) + (x.value != null ? 1 : 0) + x.confidence;
    if (score(m) > score(prev)) byKey.set(key, m);
  }
  return [...byKey.values()];
}

function normalizeAiUnit(unit: string): string {
  const u = unit.replace(/µ/g, "u").replace(/μ/g, "u").trim();
  if (!u) return "";
  if (/^g\/dl$/i.test(u)) return "g/dL";
  if (/^mg\/dl$/i.test(u)) return "mg/dL";
  if (/^mg\/l$/i.test(u)) return "mg/L";
  if (/^ug\/dl$/i.test(u)) return "ug/dL";
  if (/^ng\/ml$/i.test(u)) return "ng/mL";
  if (/^pg\/ml$/i.test(u)) return "pg/mL";
  if (/^u\/l$/i.test(u) || /^iu\/l$/i.test(u)) return "U/L";
  if (/^nmol\/l$/i.test(u)) return "nmol/L";
  if (/^mmol\/l$/i.test(u)) return "mmol/L";
  if (/^uiu\/ml$/i.test(u) || /^uu\/ml$/i.test(u)) return "uIU/mL";
  if (/^%$/i.test(u)) return "%";
  if (/mL\/min/i.test(u) || /ml\/min/i.test(u)) return "mL/min/1.73m2";
  return u;
}

async function callGroqExtraction(
  text: string,
  apiKey: string,
  meta: { part: number; parts: number },
): Promise<unknown> {
  const known = KNOWN_BIOMARKER_IDS.join(", ");
  const system = `You extract blood-lab RESULT values into JSON for Blood Analyzer.

Return ONLY JSON:
{"markers":[{"name":"string","value":number|null,"valueDisplay":"string|omit","unit":"string","biomarkerId":"string|null"}]}

Lab PDFs use many incompatible layouts. Adapt to whatever structure you see:
- Same line: "LDL Cholesterol 67.6 mg/dL"
- Dotted leaders: "Hemoglobina …… 14,70 g/dL"
- Header then Resultado: "SIDEREMIA" / "Resultado … 107 μg/100mL"
- Name + reference bands, value alone on a following line
- Tables, multi-column text, Spanish/English/mixed labels

Rules:
- Extract MEASURED patient results only — never reference-range / optimal / good / fair band endpoints.
- In band layouts, the measured value is often alone on the line AFTER optimal/good/fair — take that, not the band numbers.
- Extract EVERY distinct assay result (plain numbers and inequalities like <6.2). Aim for completeness over caution.
- For "<6.2": value=6.2, valueDisplay="<6.2".
- Prefer biomarkerId from the allowlist when confident; else null (still include the row).
- Skip patient identifiers, page numbers, narrative advice.
- Never invent values. Missing a real result is worse than an unmapped name.
- Keep the printed assay name: "Urea" is not the same as "BUN" / "Blood Urea Nitrogen" (same molecule, different unit scale).

Allowlist biomarkerId values:
${known}`;

  const user = `Part ${meta.part}/${meta.parts}. Extract ALL measured biomarker results from this lab text:

---
${text}
---`;

  let lastError = "Groq extraction failed";
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          groqJsonChatBody({
            system,
            user,
            temperature: 0,
            maxCompletionTokens: 8000,
          }),
        ),
      },
    );

    if (response.status === 429) {
      lastError = `Groq rate limited (429)`;
      const retryAfter = Number(response.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 60_000)
        : Math.min(2000 * 2 ** attempt, 30_000);
      await sleep(waitMs);
      continue;
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Groq extraction failed (${response.status})${
          detail ? `: ${detail.slice(0, 180)}` : ""
        }`,
      );
    }

    const data: unknown = await response.json();
    return JSON.parse(readGroqJsonText(data)) as unknown;
  }

  throw new Error(lastError);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
