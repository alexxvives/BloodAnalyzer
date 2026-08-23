# Biomarker data

Ranges and population stats are versioned JSON with citations:

- `/data/reference-ranges/v1/markers.json`
- `/data/population-stats/v1/stats.json`
- Policy: `/data/SOURCES.md`
- Backlog: `/data/CLINICIAN_REVIEW.md`

Educational copy (what it measures, why it matters) lives in
`lib/report/explanations.ts`, keyed by `biomarkerId`. Every id in
`KNOWN_BIOMARKER_IDS` must have an explanation even when `sourced: false`.

To fill a gap, use the `source-biomarker` skill. Source every named-page
marker in the backlog in one pass. Leave rows unsourced when the product
does not collect a required input (cycle day, PM draw time) or no catalog
publishes an interval.

Detail panels read explanations first; they must not look empty just because
optimization bands are missing.
