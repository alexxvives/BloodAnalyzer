import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractText, getDocumentProxy } from "unpdf";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(
  __dirname,
  "..",
  "lib",
  "extraction",
  "fixtures",
  "sample-lab-text.pdf",
);

const lines = [
  "Patient Example Lab Report",
  "Total Cholesterol 134 mg/dL",
  "LDL Cholesterol 67.6 mg/dL",
  "HDL Cholesterol 56 mg/dL",
  "Fasting Glucose 92 mg/dL",
  "ALT 28 U/L",
  "Hemoglobin 15.2 g/dL",
];

function escapePdfText(s) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

const ops = ["BT", "/F1 11 Tf", "50 740 Td"];
for (let i = 0; i < lines.length; i++) {
  if (i > 0) ops.push("0 -18 Td");
  ops.push(`(${escapePdfText(lines[i])}) Tj`);
}
ops.push("ET");
const stream = ops.join("\n");

const objects = [
  "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
  "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj",
  "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj",
  `4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream\nendobj`,
  "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj",
];

let pdf = "%PDF-1.4\n";
const offsets = [0];
for (const obj of objects) {
  offsets.push(Buffer.byteLength(pdf, "utf8"));
  pdf += `${obj}\n`;
}
const xrefStart = Buffer.byteLength(pdf, "utf8");
pdf += `xref\n0 ${objects.length + 1}\n`;
pdf += "0000000000 65535 f \n";
for (let i = 1; i <= objects.length; i++) {
  pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
}
pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
pdf += `startxref\n${xrefStart}\n%%EOF\n`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, pdf);

const data = new Uint8Array(Buffer.from(pdf));
const doc = await getDocumentProxy(data);
const { text } = await extractText(doc, { mergePages: true });
const joined = typeof text === "string" ? text : text.join("\n");
console.log("Wrote", outPath);
console.log("--- extracted text ---");
console.log(joined);
