import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { extractText, getDocumentProxy } from "unpdf";

const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error("Usage: node scripts/debug/debug-pdf-extract.mjs <pdf>");
  process.exit(1);
}

mkdirSync(".firecrawl", { recursive: true });
const data = new Uint8Array(readFileSync(pdfPath));
const pdf = await getDocumentProxy(data);
const { text } = await extractText(pdf, { mergePages: true });
const joined = typeof text === "string" ? text : text.join("\n");
writeFileSync(".firecrawl/results-raw.txt", joined);

console.log("pages proxy ok");
console.log("chars", joined.length);
console.log("nonWhitespace", joined.replace(/\s+/g, "").length);
console.log("--- SAMPLE ---");
console.log(joined.slice(0, 4000));
console.log("--- END SAMPLE ---");
