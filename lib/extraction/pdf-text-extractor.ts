import { extractText, getDocumentProxy } from "unpdf";
import { extractMarkersFromLabTextWithAi } from "./ai-lab-extractor";
import type { Extractor } from "./types";

/**
 * PDF path: text layer → Groq AI (layout-agnostic).
 * No layout-specific value parsers — AI extracts; user confirms.
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
            `No extractable text in “${meta.name}”. This may be a scanned PDF — use a text-based PDF or enter values manually.`,
          ],
          method: "pdf-text",
        };
      }

      const apiKey = process.env.GROQ_API_KEY?.trim();
      if (!apiKey) {
        return {
          markers: [],
          warnings: [
            "AI PDF extraction is off — set GROQ_API_KEY, or enter values manually on the confirm screen.",
          ],
          method: "pdf-text",
        };
      }

      try {
        const ai = await extractMarkersFromLabTextWithAi(text, { apiKey });
        return {
          markers: ai.markers,
          warnings: ai.warnings,
          method: "pdf-ai",
        };
      } catch (err) {
        return {
          markers: [],
          warnings: [
            `AI PDF extraction failed (${
              err instanceof Error ? err.message : "unknown error"
            }). Enter values manually from the original PDF.`,
          ],
          method: "pdf-ai",
        };
      }
    } catch (e) {
      return {
        markers: [],
        warnings: [
          `PDF parse failed for “${meta.name}”: ${
            e instanceof Error ? e.message : "unknown error"
          }. Try another export or manual entry.`,
        ],
        method: "pdf-text",
      };
    }
  },
};

async function extractPdfText(data: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(data);
  const { text } = await extractText(pdf, { mergePages: true });
  // unpdf types `text` as string when mergePages is true; tolerate arrays at runtime.
  return Array.isArray(text) ? (text as string[]).join("\n") : String(text ?? "");
}
