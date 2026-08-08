# Extraction pipeline

Lab reports are not standardized. Treat extraction as a **separate, inspectable
step** — never write straight from OCR into the saved report.

## Recommended approach (tiered)

1. **Prefer structured exports** — CSV / FHIR / HL7 from the lab portal when
   available. Highest accuracy.
2. **Text PDF** — extract the embedded text layer (`unpdf`), then run the
   heuristic lab-line parser + biomarker name map. Always confirm.
3. **Scanned PDF / photos** — vision LLM (or OCR → LLM) with a **fixed JSON
   schema** (`name`, `value`, `unit`, `labLow`, `labHigh`, `confidence`).
   Prefer the report’s printed reference interval when present.
4. **Human confirm** — mandatory UI to edit values, units, and mapped ids
   before persistence.
5. **Unit normalization** — convert mmol/L ↔ mg/dL with explicit conversion
   tables; never guess.

## Why the mock “demo values” approach failed

Returning canned markers for every PDF/image teaches the UI the wrong lesson
and hides parse failures. Empty markers + clear warnings is better than fake
success.

## Text PDF (current)

`pdfTextExtractor` uses `unpdf` + `extractMarkersFromLabText`. Upload a
digital/text-layer PDF at `/upload`. Confirm every value before save.

Supports English line layouts and Spanish clinic formats (`TEST` heading →
`Resultado … value`, dotted CBC lines, decimal commas / thousand dots).
Name map covers EN + ES aliases (`lib/extraction/name-map.ts`).

Fixture for local checks: `lib/extraction/fixtures/sample-lab-text.pdf`
(`node scripts/make-sample-lab-pdf.mjs` regenerates it).

## Next implementation step

Wire a provider (Workers AI / OpenAI vision / Document AI) behind
`imageDocumentExtractor` / a scanned-PDF branch, using the same
`ExtractionResult` type and confirmation screen.
