---
name: source-biomarker
description: Sources Blood Analyzer reference ranges and population stats from named lab catalogs and guidelines. Use when filling missing biomarker data, shrinking the NEEDS CLINICIAN REVIEW backlog, adding markers to markers.json, or when the user asks why a range is unavailable.
---

# Source biomarker data

Never invent a number. Never stop after one marker if the backlog has other
sourceable rows.

## Before writing numbers

1. Read `data/SOURCES.md` band policy and `data/CLINICIAN_REVIEW.md`.
2. List every `sourced: false` placeholder **and** every
   `AWAITING_CLINICIAN_REVIEW` id in `data/reference-ranges/reference-data.test.ts`.
3. Split the list:

   - **Source now** — a named lab catalog or guideline publishes the cutpoints
     (Mayo, ADA, ATP III, ACC/AHA, AHA/CDC, KDIGO, WHO, EASL). Fetch the page.
   - **Cannot source** — needs data we do not collect (cycle day, draw time for
     a PM-only interval), analyzer-specific units we do not store, or no
     published interval. Leave `sourced: false` or keep the review quarantine.
     Write the reason in `SOURCES.md`.

4. Source **every** "source now" item in this pass. One example is a miss.

## Band mapping

- Graded guideline with named tiers → map only the published cutpoints onto
  `attention` / `fair` / `good` / `optimal`.
- Reference interval (two endpoints only) → `attention` / `good` / `attention`.
  No invented interior.
- Secondary papers corroborate; they do not invent extra tiers.
- SiPhox / consumer "optimal" pages are visual references only.

## Required on every sourced row

- `sourced: true`
- `sourceRefs[0]` with durable `url`, verbatim interval, `verifiedAt` ISO date
- Matching `labLow` / `labHigh`
- Sex or age `demographic` when the source partitions on it
- Version bump + notes in `markers.json`
- `SOURCES.md` + `CLINICIAN_REVIEW.md`
- Shrink `AWAITING_CLINICIAN_REVIEW`; never grow it
- Scoring + `reference-data.test.ts` coverage
- Append `knowledge/log.md`

## Trust order

1. Interval printed on the user's report (parse-time; not this skill)
2. Named guidelines for decision limits
3. Named lab catalogs as fallback
4. Never a "common lab" guess

## After the data change

Run `npm test` (especially `/lib/scoring` and `reference-data.test.ts`).
Then commit, `git push`, and `npm run deploy` unless the user said local-only.
