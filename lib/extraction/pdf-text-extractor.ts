import { extractMarkersFromLabText } from "./text-lab-extractor";
import type { ExtractionResult, Extractor } from "./types";

/**
 * PDF path: pull embedded text (when present), then run the lab-text heuristic.
 * Scanned/image-only PDFs will yield little text — those need vision OCR later.
 */
export const pdfTextExtractor: Extractor = {
  accepts({ type, name }) {
    const lower = name.toLowerCase();
    return type === "application/pdf" || lower.endsWith(".pdf");
  },

  async extract(input, meta) {
    try {
      const buffer = new Uint8Array(await input.arrayBuffer());
      const text = await extractPdfText(buffer);
      if (!text.trim()) {
        return {
          markers: [],
          warnings: [
            `No extractable text in “${meta.name}”. This may be a scanned PDF — use a text-based PDF, CSV export, or manual entry.`,
          ],
          method: "pdf-text",
        };
      }
      const result = extractMarkersFromLabText(text);
      return {
        ...result,
        method: "pdf-text",
        warnings: result.warnings,
      };
    } catch (e) {
      return {
        markers: [],
        warnings: [
          `PDF parse failed for “${meta.name}”: ${
            e instanceof Error ? e.message : "unknown error"
          }. Try CSV or manual entry.`,
        ],
        method: "pdf-text",
      };
    }
  },
};

async function extractPdfText(data: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(data);
  const { text } = await extractText(pdf, { mergePages: true });
  return typeof text === "string" ? text : text.join("\n");
}
