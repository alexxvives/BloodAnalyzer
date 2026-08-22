# Extraction pipeline

Lab reports are not standardized. Treat extraction as a **separate, inspectable
step** — never write straight from OCR into the saved report.

## Recommended approach (tiered)

1. **Prefer structured exports** — CSV / FHIR / HL7 from the lab portal when
   available. Highest accuracy. CSV accepts `name,value,unit` and EasyDraw-style
   `name,unit,value` exports (section headers are skipped).
2. **Text PDF + AI** — `unpdf` text layer → light cleanup (PII redact, drop
   Insights tails, strip `optimal`/`good`/`fair` *range noise* so values stand
   out) → Groq structured JSON (`pdf-ai`) in sectioned passes. Layout-agnostic:
   AI picks the markers; we do not hardcode per-lab value parsers in the
   product path.
3. **Scanned PDF / photos** — vision LLM with the same JSON schema — not wired
   yet (`image-pending`).
4. **Human confirm** — mandatory UI to edit/delete rows and fill gaps before
   persistence.

## Why AI-first for PDFs

Clinic PDFs, portal exports, and wellness panels all look different. Hand-written
layout parsers overfit the few samples we have seen. The model receives **text
only** (light cleanup + sectioned passes) and must return measured results — not
range endpoints — into a fixed JSON schema.

## Text PDF (current)

`pdfTextExtractor`:

1. `unpdf` text layer
2. `prepareTextForModel` (cleanup only — not marker extraction)
3. Groq AI in sectioned passes when `GROQ_API_KEY` is set
4. If AI is off/fails → empty markers + warning (manual entry)

Always confirm every value before save.

Fixture for heuristic checks: `lib/extraction/fixtures/sample-lab-text.pdf`
(`node scripts/make-sample-lab-pdf.mjs` regenerates it).

## Next implementation step

Wire vision LLM behind `imageDocumentExtractor` / scanned-PDF branch using the
same `ExtractionResult` type and confirmation screen.
