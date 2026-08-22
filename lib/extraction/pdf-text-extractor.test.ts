import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { pdfTextExtractor } from "./pdf-text-extractor";

const fixture = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "sample-lab-text.pdf",
);

describe("pdfTextExtractor", () => {
  const previousKey = process.env.GROQ_API_KEY;

  afterEach(() => {
    if (previousKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousKey;
  });

  it("accepts PDFs and leaves markers empty when AI is off (non-band PDF)", async () => {
    delete process.env.GROQ_API_KEY;

    const bytes = readFileSync(fixture);
    const file = new File([bytes], "sample-lab-text.pdf", {
      type: "application/pdf",
    });

    expect(pdfTextExtractor.accepts(file)).toBe(true);

    const result = await pdfTextExtractor.extract(file, {
      name: file.name,
      type: file.type,
    });

    expect(result.method).toBe("pdf-text");
    expect(result.markers).toEqual([]);
    expect(result.warnings.some((w) => /GROQ_API_KEY/i.test(w))).toBe(true);
  });
});
