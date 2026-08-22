/**
 * Live smoke test: PDF text → Groq AI extraction.
 * Usage: node --env-file=.env scripts/debug/debug-pdf-ai.mjs path/to.pdf
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { extractText, getDocumentProxy } from "unpdf";

const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error("Usage: node --env-file=.env scripts/debug/debug-pdf-ai.mjs <pdf>");
  process.exit(1);
}
if (!process.env.GROQ_API_KEY) {
  console.error("GROQ_API_KEY missing");
  process.exit(1);
}

mkdirSync(".firecrawl", { recursive: true });
const data = new Uint8Array(readFileSync(pdfPath));
const pdf = await getDocumentProxy(data);
const { text } = await extractText(pdf, { mergePages: true });
const joined = typeof text === "string" ? text : text.join("\n");

const { extractMarkersFromLabTextWithAi } = await import(
  "../../lib/extraction/ai-lab-extractor.ts"
);

const result = await extractMarkersFromLabTextWithAi(joined, {
  apiKey: process.env.GROQ_API_KEY,
});
writeFileSync(".firecrawl/results-ai.json", JSON.stringify(result, null, 2));
console.log("method", result.method);
console.log("count", result.markers.length);
console.log(
  result.markers
    .map(
      (m) =>
        `${m.biomarkerId ?? "?"} | ${m.name} = ${m.valueDisplay ?? m.value} ${m.unit}`,
    )
    .join("\n"),
);
console.log("warnings", result.warnings);
