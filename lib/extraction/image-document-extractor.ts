import type { ExtractionResult, Extractor } from "./types";

/**
 * Image path placeholder until a vision/OCR provider is wired.
 * Returns empty markers (not fake values) so the user must enter or retry.
 */
export const imageDocumentExtractor: Extractor = {
  accepts({ type, name }) {
    const lower = name.toLowerCase();
    return (
      type.startsWith("image/") ||
      lower.endsWith(".png") ||
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".webp") ||
      lower.endsWith(".heic")
    );
  },

  async extract(_input, meta): Promise<ExtractionResult> {
    return {
      method: "image-pending",
      markers: [],
      warnings: [
        `Image OCR is not connected yet for “${meta.name}”.`,
        "Best options today: export a CSV from your lab portal, upload a text-based PDF, or enter values manually on the next step.",
        "Recommended next step: vision-LLM extraction with a fixed JSON schema + mandatory human confirm (see extraction README notes).",
      ],
    };
  },
};
