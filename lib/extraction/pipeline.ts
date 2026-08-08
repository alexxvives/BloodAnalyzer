import { csvExtractor } from "./csv-extractor";
import { imageDocumentExtractor } from "./image-document-extractor";
import { pdfTextExtractor } from "./pdf-text-extractor";
import type { ExtractionResult, Extractor } from "./types";

const DEFAULT_EXTRACTORS: Extractor[] = [
  csvExtractor,
  pdfTextExtractor,
  imageDocumentExtractor,
];

export function getExtractor(
  file: { type: string; name: string },
  extractors: Extractor[] = DEFAULT_EXTRACTORS,
): Extractor | null {
  return extractors.find((e) => e.accepts(file)) ?? null;
}

export async function extractFromFile(
  file: File | (Blob & { name?: string; type: string }),
  extractors: Extractor[] = DEFAULT_EXTRACTORS,
): Promise<ExtractionResult> {
  const meta = {
    name: "name" in file && file.name ? file.name : "upload",
    type: file.type || "application/octet-stream",
  };

  const extractor = getExtractor(meta, extractors);
  if (!extractor) {
    return {
      markers: [],
      warnings: [
        `No extractor for “${meta.name}” (${meta.type}). Try CSV, a text PDF, or use manual entry.`,
      ],
      method: "manual",
    };
  }

  return extractor.extract(file, meta);
}
