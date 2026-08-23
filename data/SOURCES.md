# Data sources

Reference ranges and population statistics used by Blood Analyzer must be
versioned and cited. **Do not ship invented numbers to real users.**

## Status

| Dataset | Location | Citation status |
|---|---|---|
| Reference ranges v1.3.2 | `/data/reference-ranges/v1/markers.json` | **Mixed** — Mayo/ADA/ACC/KDIGO/Harris plus v1.3.2 Mayo APOAB ApoB:ApoA1 (sex-specific); 19 CBC/chem rows still awaiting clinician review; remaining calculated ratios and female cycle-phase hormones stay unsourced |
| Population stats v1.8.1 | `/data/population-stats/v1/stats.json` | **Partial NHANES load** — see below |

Until an entry is marked `sourced: true` **and** reviewed for production, treat
the product as educational/beta. Scoring returns `rangeAvailable: false` (UI:
**"range not available"**) when `sourced` is false or the marker is missing.

`data/reference-ranges/reference-data.test.ts` enforces the invariants below and
fails the build if they regress. It is the file to update when a marker is
reviewed.

## Band policy

Two different kinds of number end up in `bands`, and they must not be confused:

- A **graded guideline** (ATP III, ADA, WHO, EASL, Refsum) defines named tiers or
  multiple real thresholds. These map onto `attention`/`fair`/`good`/`optimal`
  only where the source itself supplies the cutpoints.
- A **reference interval** defines only a 2.5th and 97.5th percentile. Nothing in
  such a source says the middle of the interval is better than its edges, so
  rows built from reference intervals band as **`attention` / `good` /
  `attention`** at those two endpoints. Secondary published intervals may be
  cited for corroboration, but they do **not** invent a `fair` or `optimal` tier.

Consequence: markers sourced from reference intervals cap at `good`, which
slightly lowers a perfect panel's optimization score (~96% instead of 100% when
many CBC/chemistry markers are in range). That is intentional — inventing an
optimum to preserve a round number would violate non-negotiable #1.

## Sex- and age-specific rows (v1.2.0 / v1.2.1)

Nine markers previously served a male-derived range to every user. Their own
citations said "adult male" while `demographic` was unset, so the median woman
graded `attention` or `fair` for hematocrit in all six age slices.

| biomarkerId | Split by | Primary source (defines bands) | Second source (citation only) |
|---|---|---|---|
| `hematocrit` | sex | [Mayo CBC 9109](https://www.mayocliniclabs.com/test-catalog/Overview/9109) | [NORIP, Nordin 2004](https://doi.org/10.1080/00365510410002797) |
| `rbc` | sex | [Mayo CBC 9109](https://www.mayocliniclabs.com/test-catalog/Overview/9109) | [NORIP, Nordin 2004](https://doi.org/10.1080/00365510410002797) |
| `creatinine` | sex | [Mayo CRTS1](https://www.mayocliniclabs.com/test-catalog/Overview/48216) (enzymatic, IDMS-traceable) | [NORIP enzymatic subgroup, Rustad 2004](https://nyenga.net/norip/SJCLI/final/main.pdf) |
| `uric-acid` | sex | [Mayo URIC](https://www.mayocliniclabs.com/test-catalog/Overview/8440) | [ELSA-Brasil, BMI<25 subgroup](https://www.scielo.br/j/adr/a/HTHNj6pnzmDJWMHSnd8PBnv/) |
| `ggt` | sex | [Mayo GGT](https://www.mayocliniclabs.com/test-catalog/overview/8677) | [NORIP enzymes, Strømme 2004](http://www.nyenga.net/norip/SJCLI/final/Johan%20S.pdf) |
| `esr` | sex **and** age 50 | [StatPearls, NIH Bookshelf](https://www.ncbi.nlm.nih.gov/books/NBK557485/) | — |
| `serum-iron` | sex | [Mayo IRON/SFEC](https://www.mayocliniclabs.com/test-catalog/overview/621385) | [Labcorp 001339](https://www.labcorp.com/tests/001339/iron) (disagreement only) |
| `ferritin` | sex | [WHO 2020](https://www.who.int/publications/i/item/9789240000124) + [EASL 2022](https://doi.org/10.1016/j.jhep.2022.03.033) | [ARUP 0070065](https://ltd.aruplab.com/Tests/Pub/0070065) |
| `homocysteine` | age only — **not sex** | [Refsum 2004 expert opinion, Table 6](https://doi.org/10.1373/clinchem.2003.021634) | — |
| `hemoglobin` | sex | [WHO 2011 anemia cutoffs](https://www.who.int/publications/i/item/WHO-NMH-NHD-MNM-11.1) + common lab highs | — |
| `urea` (BUN) | sex | [Mayo BUN 81793](https://www.mayocliniclabs.com/test-catalog/overview/81793/blood-urea-nitrogen-bun-serum) | — |

Notes on the ones that are not straightforward:

- **`ferritin`** previously graded 150–250 ng/mL as `optimal`, which sits inside
  the range where guidelines say to evaluate for iron overload — a woman at 240
  was told she was optimal. Now `attention` starts at 300 (men) and 200 (women)
  per EASL 2022 and ACG 2019, with WHO's >200/>150 risk thresholds as the `fair`
  step. The `optimal` band of 50–100 is the phlebotomy *maintenance target* for
  treated haemochromatosis, borrowed as a proxy because no guideline defines an
  optimum for healthy adults; the marker's source refs say so explicitly. Both
  guideline thresholds also require transferrin saturation, which this panel does
  not measure.
- **`homocysteine` is deliberately not sex-split.** Refsum et al. acknowledge a
  ~2 µmol/L sex difference and then decline to partition on it, because "the
  proportion with tHcy above a given upper reference limit is similar in adult
  men and women." Their limits partition on age and folate status instead.
- **`serum-iron` is the weakest row in the file.** No CLSI-methodology,
  sex-stratified study could be verified; the lab catalogs disagree by more than
  the sex difference itself, and the analyte varies diurnally and across the
  menstrual cycle. We still ship the Mayo IRON/SFEC interval (named lab + assay
  in the popover) and state explicitly that it is lab-specific, not
  population-derived. Ferritin and transferrin saturation carry more signal.
- **`esr` has no true 95% reference interval.** The Miller formula (age/2 for
  men, (age+10)/2 for women) is a 98th-percentile rule of thumb from 1983 that
  overestimates in the elderly; the four-cell sex × age-50 table is lab
  convention. Graded, but not on the same statistical footing as the rest.

## BUN vs urea (v1.3.0)

They are the same molecule reported two ways. The **right** product behavior is
not “pick Mayo or pick Europe” — it is **detect the printed assay, convert to
one canonical scale, then grade**.

| Lab prints | Typical unit | What to do |
|---|---|---|
| BUN / blood urea nitrogen / nitrógeno ureico | mg/dL | Already BUN. Grade on Mayo (men 8–24, women 6–21). |
| Urea (not “urea nitrogen”) | mg/dL | European urea mass. Convert BUN = urea ÷ 2.14, then grade. |
| Urea or BUN | mmol/L | SI amount of substance. Convert BUN mg/dL = mmol/L × 2.8, then grade. |

Canonical storage is BUN mg/dL because Mayo, NHANES, and US at-home panels use
it. A Spanish “Urea 34 mg/dL” and a US “BUN 16 mg/dL” are the same physiology.
Grading 34 on the BUN scale would falsely flag attention; grading 16 on a
European urea interval (≈19–44) would falsely flag low. Conversion is wired in
`lib/extraction/canonicalize.ts` from the **printed name**, because the two
mg/dL scales overlap and cannot be told apart from the number alone.

## ApoB:ApoA1 ratio (v1.3.2)

`apo-b-apo-a1-ratio` uses Mayo Clinic Laboratories **APOAB** (result RBAA1)
adult Lower / Average / Higher Risk tiers, split by sex:

| Sex | Lower risk (optimal) | Average (good) | Higher risk (attention) | Lab high |
|---|---|---|---|---|
| Men ≥18 | <0.7 | 0.7–0.9 | >0.9 | 0.9 |
| Women ≥18 | <0.6 | 0.6–0.8 | >0.8 | 0.8 |

Source: [Mayo APOAB](https://www.mayocliniclabs.com/test-catalog/Overview/607593).
Mayo names three tiers, so there is no separate `fair` band. INTERHEART
(McQueen 2008) is cited only as supporting epidemiology; it does not define
these cutpoints. Consumer “optimal / good / fair” pages (including SiPhox)
are visual references only and are not copied into the data layer.

Still no NHANES demographic median for this ratio — the UI keeps
**benchmark data not yet available** for population comparison.

## Mayo CBC / liver / B12 batch (v1.3.1)

These rows were marked sourced but still said "NEEDS CLINICIAN REVIEW". They
now use Mayo Clinic Laboratories catalog intervals, with invented interiors
removed:

| biomarkerId | Interval used for bands | Catalog |
|---|---|---|
| `alt` | men 7–55 / women 7–45 U/L | [Mayo 8362](https://www.mayocliniclabs.com/test-catalog/Overview/8362) |
| `ast` | men 8–48 / women 8–43 U/L | [Mayo 8360](https://www.mayocliniclabs.com/test-catalog/Overview/8360) |
| `wbc` | 3.4–9.6 ×10⁹/L (3400–9600 /µL) | [Mayo CBC 9109](https://www.mayocliniclabs.com/test-catalog/Overview/9109) |
| `platelets` | men 135–317 / women 157–371 ×10⁹/L | [Mayo CBC 9109](https://www.mayocliniclabs.com/test-catalog/Overview/9109) |
| `mcv` | 78.2–97.9 fL | [Mayo CBC 9109](https://www.mayocliniclabs.com/test-catalog/Overview/9109) |
| `rdw` | men 11.8–14.5% / women 12.2–16.1% | [Mayo CBC 9109](https://www.mayocliniclabs.com/test-catalog/Overview/9109) |
| `vitamin-b12` | 180–914 ng/L (= pg/mL) | [Mayo 9154](https://www.mayocliniclabs.com/test-catalog/Overview/9154) |

Still unverified (no matching Mayo page in this pass, or unit mismatch): TSH,
folate, CRP vs hs-CRP, cortisol, transferrin, Lp(a), PDW, MCH/MCHC, and
percentage differentials (Mayo CBC publishes absolute counts, not %).

## Why US and European numbers differ

Neither side is "more true." They are often answering different questions:

1. **Units.** US labs report conventional units (mg/dL, g/dL, ng/mL). European
   labs report SI units (mmol/L, g/L, nmol/L). Glucose 100 mg/dL = 5.6 mmol/L;
   cholesterol 200 mg/dL = 5.17 mmol/L. Same physiology, different scale.
2. **Same analyte, different name.** BUN vs urea is the textbook case (above).
3. **Reference interval vs clinical decision limit.** A Mayo/NORIP interval is
   the central 95% of a local healthy sample (CLSI EP28 / IFCC). ATP III, ADA,
   ESC/EAS, and KDIGO publish *treatment* cutpoints. ESC/EAS 2019 LDL goals for
   very-high-risk patients (<55 mg/dL / 1.4 mmol/L) are much tighter than ATP
   III's "optimal <100" — they are risk targets, not "normal."
4. **Assay.** Enzymes (ALT, AST, ALP, GGT) move with reagent, IFCC vs older
   methods, and pyridoxal-5-phosphate. Mayo's ALT 7–55 is *that analyzer*.
5. **Population.** Altitude, diet, BMI, and genetics shift the 95% window.
   NORIP (Nordic) and Mayo (Rochester, MN) are both legitimate and will not
   match.

**Trust order for this product:** (1) the interval printed on the report that
produced the number, (2) named guidelines for decision limits (ADA, KDIGO,
ATP III / ACC, ESC/EAS, WHO), (3) named lab catalogs (Mayo, NORIP) as a
fallback, (4) never an unsourced "common lab" guess. Europe is not more
trustworthy than the US, or vice versa. The printed assay wins.

## Optimal interiors (v1.3.0)

SiPhox-style extra-green wellness bands are unpublished and still not copied.
**Optimal is added only where a named source publishes extra cutpoints:**

| Marker | Extra sourced tiers | Source |
|---|---|---|
| `hba1c` | optimal 4.0–5.6 / fair 5.7–6.4 / attention ≥6.5 | Mayo reference + ADA diagnostic categories |
| `apo-b` | optimal 48–89 / good 90–99 / fair 100–119 / attention ≥120 (and <48) | Mayo APOLB adult categories; ACC/AHA 2018 flags ≥130 as risk-enhancing |
| `egfr` | optimal ≥90 / good 60–89 / fair 30–59 / attention <30 | KDIGO 2024 G1–G5 |
| `omega-3-index` | attention ≤4 / fair 4–8 / optimal ≥8 | Harris & von Schacky 2004 |
| Lipids, glucose, HDL, ferritin, vitamin D, … | already had guideline interiors | ATP III, ADA, WHO/EASL, Holick |

CBC, BUN, ALP, bilirubin, albumin, enzymes, TSH, most hormones: still
**attention / good / attention** at the Mayo (or other) reference interval.
Inventing “optimal BUN 10–18” would be the unpublished wellness scale we
refused to copy from SiPhox.

Female estradiol, FSH, and LH stay **unsourced**: Mayo intervals are
cycle-phase and menopausal, and this product does not collect cycle day.

## Corrected citations (v1.2.0)

Three markers cited a guideline that did not contain the numbers attached to it:

- **`total-cholesterol`** had `optimal <180` / `good 180–199`. ATP III Table 2
  defines only <200 Desirable / 200–239 Borderline high / ≥240 High — there is no
  180 cutpoint anywhere in it. Collapsed to the three tiers ATP III actually
  defines.
- **`hdl-cholesterol`** (female) used `<50 attention` and `≥70 optimal` while the
  male row used `<40` and `≥60` from the same citation. ATP III defines low HDL
  categorically as <40 **for both sexes**, and its Framingham HDL point strata are
  identical in the men's and women's tables. The women's <50 figure is real but
  comes from Table 8 (metabolic syndrome criteria), so it now drives `labLow`
  only, not the grade.
- **`vitamin-d`** had an `optimal 50–80` band that appears nowhere in Holick 2011,
  which defines a single sufficiency band of 30–100 ng/mL. Collapsed accordingly,
  with toxicity moved to the >150 ng/mL figure the guideline gives. A second
  source ref records that the Endocrine Society
  [withdrew the 30 ng/mL threshold in 2024](https://doi.org/10.1210/clinem/dgae322)
  without proposing a replacement.

### Review checklist before real user data

- [ ] Clinician or qualified reviewer signs off on each band
- [ ] Resolve the 19 rows still marked `sourced: true` with a "NEEDS CLINICIAN
      REVIEW" citation — each must gain a real citation or flip to
      `sourced: false`. The list is pinned in `reference-data.test.ts`; the test
      fails if it grows.
- [ ] Decide what users with `sex: "other"` should see. They currently get no
      range for the sex-split markers and the generic row for everything else,
      and `stats.json` has no rows for them at all.
- [ ] Extend population stats beyond ages 20–79 (18–19 and 80+ have no benchmark)
- [ ] Prefer lab-report-provided reference intervals when available at parse time
- [ ] Set `verifiedAt` ISO dates on `sourceRefs` after review
- [ ] Flip dataset `reviewStatus` from `provisional` to `reviewed`
- [ ] Remove or keep `unsourced-example` out of production seeds

## Population benchmarks

Prefer a named public dataset (e.g. NHANES for US demographics) sliced by
age + sex. Current load (v1.8.1):

**Adult means (broad 20–79 / 15–79 bands)**

- Gao et al., *J Am Heart Assoc* 2023 (NHANES 2017–2018 age-/sex-adjusted means):
  TC 188.4, LDL-C 111.7, HDL-C 53.4, triglycerides 91.4 mg/dL
  https://pmc.ncbi.nlm.nih.gov/articles/PMC9973640/
- Le, *PLoS One* 2016 (NHANES 2003–2012): hemoglobin men 14.9 / women 13.4 g/dL
  https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0166635

**Morning cortisol (sex-stratified adult AM medians, µg/dL)**

- WVU C8 Health Project: males median 14.50 / mean 15.09; females median 13.10 /
  mean 14.42 (adults >18, morning draw)
  https://health.wvu.edu/media/5129/cortisol-all.pdf

**ESR (age-/sex-stratified medians, mm/h)**

- Alende et al., *Medicine* 2019 — A-Estrada (Spain) population sample (n=1472)
  https://pmc.ncbi.nlm.nih.gov/articles/PMC6716712/

**Age-/sex-stratified medians (20–29 … 70–79)** from CDC NHANES public
laboratory microdata, as redistributed by LabNorms percentile tables:

- Fasting glucose, ALT, AST, GGT, creatinine, uric acid, hematocrit, WBC,
  platelets, RBC, MCV, MCH, MCHC, RDW, ferritin, CRP (hs-CRP), serum iron,
  serum folate (2017–March 2020)
- WBC differential **percentages** (neutrophils, lymphocytes, monocytes,
  eosinophils) from NHANES 2017–March 2020 via LabNorms percent-of-WBC tables
- Vitamin D 25(OH)D from NHANES 2017–2018
- Vitamin B12 from NHANES 2013–2014
- TSH from NHANES 2009–2012 (mIU/L ≡ uU/mL)
- BUN from NHANES 2017–March 2020 medians (via LabNorms; same unit as Mayo BUN)
- Lp(a): Brandt et al., *J Clin Lipidol* 2020 (NHANES III 1991–1994)
  sex-stratified medians — men 13 / women 14 mg/dL
  https://pmc.ncbi.nlm.nih.gov/articles/PMC7641964/
- Rebuild with: `node scripts/generate-population-stats.mjs`

Transferrin note:

- Serum transferrin mg/dL is **derived** from NHANES TIBC medians × 0.70
  (StatPearls Iron-Binding Capacity conversion). NHANES does not publish
  transferrin concentration directly.

Still absent from the **population benchmarks** (no cited matching unit/slice
yet) — note these markers *are* graded in `markers.json`, they simply have no
population comparison, so the UI shows "benchmark data not yet available":

- PDW in fL (large-sample PDW is typically % CV on Sysmex; fL scales differ by analyzer)
- Basophil % (NHANES `LBXBAPCT` exists; no LabNorms age/sex median table yet)
- Immature granulocyte counts
- Homocysteine, ESR at 2 h, band forms, atypical lymphocytes

Two markers have population medians that grade below `good`, and both are real
findings rather than range bugs. They are listed as explicit exceptions in
`reference-data.test.ts`:

- **Fasting glucose** — the median US adult over 30 genuinely sits in the ADA's
  impaired-fasting-glucose band (100–125 mg/dL). The mapping is correct.
- **Vitamin D** — the median of 23–30 ng/mL falls in Holick 2011's insufficiency
  band, using a threshold the Endocrine Society has since withdrawn.

Also missing from the catalog entirely: sodium, potassium, chloride, calcium,
magnesium, phosphorus, bicarbonate, LDH, reticulocytes, MPV. Total protein and
direct bilirubin are now Mayo-sourced. Remaining unsourced placeholders are
other calculated ratios, VLDL, eAG, UIBC, and female cycle-phase
estradiol/FSH/LH. ApoB:ApoA1 is Mayo APOAB-sourced (v1.3.2).
Electrolytes are still the dangerous-when-low gap.

## Biological age (educational)

`lib/scoring/biological-age.ts` maps the graded optimization score to an
educational age estimate (score 100 → up to 12 years younger than
chronological; score 50 → same age; score 0 → up to 12 years older). This is
**not** Levine PhenoAge or epigenetic age — UI must keep that disclaimer.
