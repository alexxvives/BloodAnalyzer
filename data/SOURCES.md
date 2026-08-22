# Data sources

Reference ranges and population statistics used by Blood Analyzer must be
versioned and cited. **Do not ship invented numbers to real users.**

## Status

| Dataset | Location | Citation status |
|---|---|---|
| Reference ranges v1.2.2 | `/data/reference-ranges/v1/markers.json` | **Mixed** — Mayo-cited ApoA1, iron saturation, and C-peptide added; 27 rows still awaiting clinician review; calculated ratios remain unsourced placeholders |
| Population stats v1.8.0 | `/data/population-stats/v1/stats.json` | **Partial NHANES load** — see below |

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
- [ ] Resolve the 27 rows still marked `sourced: true` with a "NEEDS CLINICIAN
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
age + sex. Current load (v1.8.0):

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
- Urea from NHANES BUN medians × 2.14 (European urea mg/dL)
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
direct bilirubin are now in the catalog as **unsourced placeholders** (shown
when uploaded, graded only after a citation). These are exactly the markers
where a low value is dangerous, so remaining gaps are still worth closing.

## Biological age (educational)

`lib/scoring/biological-age.ts` maps the graded optimization score to an
educational age estimate (score 100 → up to 12 years younger than
chronological; score 50 → same age; score 0 → up to 12 years older). This is
**not** Levine PhenoAge or epigenetic age — UI must keep that disclaimer.
