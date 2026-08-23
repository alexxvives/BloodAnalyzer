# Clinician review checklist (S4)

**This file does not invent medical ranges.** Agents and engineers must not
fill gaps with guessed numbers. Only a qualified reviewer may flip rows from
provisional → reviewed or add new markers with real citations.

See also: [`SOURCES.md`](./SOURCES.md), `reference-data.test.ts`.

## Process

1. Open `/data/reference-ranges/v1/markers.json`
2. For each row marked with a “NEEDS CLINICIAN REVIEW” citation (or
   `sourced: true` without a durable URL), either:
   - attach a real citation + `verifiedAt` ISO date on `sourceRefs`, or
   - set `sourced: false` so the UI shows **range not available**
3. Prefer lab-report-provided intervals at parse time when available
4. Decide policy for `sex: "other"` (currently no sex-split ranges)
5. When the panel is signed off, set dataset `reviewStatus` to `reviewed`

## Still missing from the catalog (need citations before add)

Sodium, potassium, chloride, calcium, magnesium, phosphorus, bicarbonate,
LDH, reticulocytes, MPV — see SOURCES.md.
Total protein and direct bilirubin now have Mayo-cited intervals. Still
unsourced: remaining calculated ratios (TC:HDL, LDL:HDL, LDL:ApoB, TG:HDL, and
hormone/thyroid ratios), VLDL, eAG, UIBC, and female cycle-phase estradiol /
FSH / LH (Mayo intervals require cycle day or menopausal status). ApoB:ApoA1
is Mayo APOAB-sourced (v1.3.2).

## Population benchmarks

Gaps listed in SOURCES.md (“Still absent from the population benchmarks”).
UI must keep showing **benchmark data not yet available** until cited.
