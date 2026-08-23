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
unsourced: remaining calculated ratios (T:C, cortisol:DHEA-S, free T3:T4,
TSH:T4) and female cycle-phase estradiol / FSH / LH (Mayo intervals require
cycle day or menopausal status). AST:ALT and female PSA were removed (v1.3.6).
TG:HDL (McLaughlin 2005), LDL-C:ApoB (Taneva 2024 <1.2), and % free
testosterone (Labcorp 081786 adults) are sourced as of v1.3.6. VLDL
(Quest 319 / Mayo LMPP), UIBC (Labcorp 18–60), FAI (Labcorp 146688),
BUN:creatinine (Quest 296 adults), and transferrin (Mayo TRSF) are sourced
as of v1.3.5. ApoB:ApoA1 is Mayo APOAB-sourced (v1.3.2). TSH, morning
cortisol, folate, hs-CRP, and Lp(a) are sourced as of v1.3.3. TC:HDL
(Quest 7600), LDL:HDL (Quest 19543), and eAG (ADA/ADAG) are sourced as of
v1.3.4.

## Population benchmarks

Gaps listed in SOURCES.md (“Still absent from the population benchmarks”).
UI must keep showing **benchmark data not yet available** until cited.
