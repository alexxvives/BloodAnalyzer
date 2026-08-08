import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { pdfTextExtractor } from "./pdf-text-extractor";

const fixture = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "sample-lab-text.pdf",
);

describe("pdfTextExtractor", () => {
  it("extracts mapped biomarkers from a text-layer PDF", async () => {
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
    const byId = Object.fromEntries(
      result.markers
        .filter((m) => m.biomarkerId)
        .map((m) => [m.biomarkerId, m]),
    );

    expect(byId["total-cholesterol"]?.value).toBe(134);
    expect(byId["ldl-cholesterol"]?.value).toBe(67.6);
    expect(byId["hdl-cholesterol"]?.value).toBe(56);
    expect(byId["glucose-fasting"]?.value).toBe(92);
    expect(byId.alt?.value).toBe(28);
    expect(byId.hemoglobin?.value).toBe(15.2);
  });
});
