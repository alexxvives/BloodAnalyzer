/**
 * Full PDF pipeline smoke test (AI extraction path).
 * Usage: npx tsx --env-file=.env scripts/debug/debug-pdf-full.mjs path/to.pdf
 */
import { readFileSync } from "fs";
import { pdfTextExtractor } from "../../lib/extraction/pdf-text-extractor.ts";

const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error("Usage: npx tsx --env-file=.env scripts/debug/debug-pdf-full.mjs <pdf>");
  process.exit(1);
}

const buf = readFileSync(pdfPath);
const file = new File([buf], "results.pdf", { type: "application/pdf" });
const result = await pdfTextExtractor.extract(file, {
  name: "results.pdf",
  type: "application/pdf",
});

console.log("method", result.method);
console.log("count", result.markers.length);
console.log(
  "mapped",
  result.markers.filter((m) => m.biomarkerId).length,
);
for (const m of result.markers) {
  console.log(
    `${m.biomarkerId ?? "?"} | ${m.name} = ${m.valueDisplay ?? m.value} ${m.unit}`,
  );
}
console.log("warnings", result.warnings);
