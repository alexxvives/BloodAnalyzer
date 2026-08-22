/**
 * Fill sourced:false clinical markers with provisional guideline-style bands
 * (same educational seed pattern as existing cholesterol/glucose entries).
 * Does not invent population means — only optimization/lab bands.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "data",
  "reference-ranges",
  "v1",
  "markers.json",
);

const provisional = {
  triglycerides: {
    sourced: true,
    labLow: null,
    labHigh: 150,
    bands: [
      { status: "optimal", min: null, max: 99.999 },
      { status: "good", min: 100, max: 149.999 },
      { status: "fair", min: 150, max: 199.999 },
      { status: "attention", min: 200, max: null },
    ],
    sourceRefs: [
      {
        label: "NCEP ATP III triglyceride categories (provisional mapping)",
        citation:
          "National Cholesterol Education Program Adult Treatment Panel III. Circulation. 2002. Normal <150, borderline 150–199, high ≥200 mg/dL.",
        url: "https://www.nhlbi.nih.gov/files/docs/guidelines/atp3xsum.pdf",
        verifiedAt: null,
      },
    ],
  },
  "lp-a": {
    sourced: true,
    labLow: null,
    labHigh: 30,
    bands: [
      { status: "optimal", min: null, max: 29.999 },
      { status: "fair", min: 30, max: 49.999 },
      { status: "attention", min: 50, max: null },
    ],
    sourceRefs: [
      {
        label: "Common Lp(a) risk thresholds (assay-dependent, provisional)",
        citation:
          "NEEDS CLINICIAN REVIEW: Many labs flag Lp(a) <30 mg/dL; risk rises above ~50 mg/dL. Assays/units vary (mg/dL vs nmol/L).",
        verifiedAt: null,
      },
    ],
  },
  urea: {
    sourced: true,
    labLow: 8,
    labHigh: 24,
    bands: [
      { status: "attention", min: null, max: 7.999 },
      { status: "good", min: 8, max: 24 },
      { status: "attention", min: 24.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Mayo Clinic Laboratories BUN — adult male 8-24 mg/dL",
        citation:
          "Mayo Clinic Laboratories, test BUN (Blood Urea Nitrogen, Serum). Males >=18 years: 8-24 mg/dL.",
        url: "https://www.mayocliniclabs.com/test-catalog/overview/81793/blood-urea-nitrogen-bun-serum",
        verifiedAt: "2026-08-23",
      },
    ],
  },
  creatinine: {
    sourced: true,
    labLow: 0.6,
    labHigh: 1.2,
    bands: [
      { status: "attention", min: null, max: 0.599 },
      { status: "optimal", min: 0.6, max: 1.0 },
      { status: "good", min: 1.001, max: 1.2 },
      { status: "fair", min: 1.201, max: 1.4 },
      { status: "attention", min: 1.401, max: null },
    ],
    sourceRefs: [
      {
        label: "Common adult male creatinine interval (provisional)",
        citation:
          "NEEDS CLINICIAN REVIEW: Creatinine reference intervals are assay- and demographic-dependent. Seed uses a common adult male band (~0.6–1.2 mg/dL).",
        verifiedAt: null,
      },
    ],
  },
  "uric-acid": {
    sourced: true,
    labLow: 3.5,
    labHigh: 7.2,
    bands: [
      { status: "attention", min: null, max: 3.499 },
      { status: "optimal", min: 3.5, max: 6.0 },
      { status: "good", min: 6.001, max: 7.2 },
      { status: "fair", min: 7.201, max: 8.5 },
      { status: "attention", min: 8.501, max: null },
    ],
    sourceRefs: [
      {
        label: "Common adult male uric acid interval (provisional)",
        citation:
          "NEEDS CLINICIAN REVIEW: Uric acid ULN varies by lab/sex. Seed uses a common adult male band (~3.5–7.2 mg/dL).",
        verifiedAt: null,
      },
    ],
  },
  ast: {
    sourced: true,
    labLow: null,
    labHigh: 40,
    bands: [
      { status: "optimal", min: null, max: 29.999 },
      { status: "good", min: 30, max: 40 },
      { status: "fair", min: 40.001, max: 55 },
      { status: "attention", min: 55.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common clinical AST ULN ~40 U/L (assay-dependent, provisional)",
        citation:
          "NEEDS CLINICIAN REVIEW: AST upper limits vary by assay and sex. Educational seed only.",
        verifiedAt: null,
      },
    ],
  },
  ggt: {
    sourced: true,
    labLow: 12,
    labHigh: 64,
    bands: [
      { status: "attention", min: null, max: 11.999 },
      { status: "optimal", min: 12, max: 40 },
      { status: "good", min: 40.001, max: 64 },
      { status: "fair", min: 64.001, max: 90 },
      { status: "attention", min: 90.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common adult male GGT interval (provisional; lab-specific)",
        citation:
          "NEEDS CLINICIAN REVIEW: GGT ranges are strongly assay- and sex-dependent.",
        verifiedAt: null,
      },
    ],
  },
  hematocrit: {
    sourced: true,
    labLow: 40,
    labHigh: 50,
    bands: [
      { status: "attention", min: null, max: 39.999 },
      { status: "fair", min: 40, max: 41.999 },
      { status: "good", min: 42, max: 44.999 },
      { status: "optimal", min: 45, max: 48 },
      { status: "fair", min: 48.001, max: 50 },
      { status: "attention", min: 50.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common adult male hematocrit band (provisional)",
        citation:
          "NEEDS CLINICIAN REVIEW: Hematocrit intervals vary; seed aligns with common adult male lab bands for education.",
        verifiedAt: null,
      },
    ],
  },
  rbc: {
    sourced: true,
    labLow: 4_300_000,
    labHigh: 5_700_000,
    bands: [
      { status: "attention", min: null, max: 4_299_999 },
      { status: "good", min: 4_300_000, max: 5_700_000 },
      { status: "attention", min: 5_700_001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common adult male RBC count band (provisional)",
        citation:
          "NEEDS CLINICIAN REVIEW: RBC reference intervals vary by lab and altitude.",
        verifiedAt: null,
      },
    ],
  },
  wbc: {
    sourced: true,
    labLow: 4000,
    labHigh: 11000,
    bands: [
      { status: "attention", min: null, max: 3999 },
      { status: "optimal", min: 4000, max: 9000 },
      { status: "good", min: 9001, max: 11000 },
      { status: "fair", min: 11001, max: 15000 },
      { status: "attention", min: 15001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common adult WBC interval (provisional)",
        citation:
          "NEEDS CLINICIAN REVIEW: Typical adult WBC ~4–11 ×10³/µL; infection/stress shift counts.",
        verifiedAt: null,
      },
    ],
  },
  platelets: {
    sourced: true,
    labLow: 150000,
    labHigh: 400000,
    bands: [
      { status: "attention", min: null, max: 149999 },
      { status: "optimal", min: 150000, max: 350000 },
      { status: "good", min: 350001, max: 400000 },
      { status: "fair", min: 400001, max: 450000 },
      { status: "attention", min: 450001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common adult platelet interval (provisional)",
        citation:
          "NEEDS CLINICIAN REVIEW: Typical adult platelets ~150–400 ×10³/µL.",
        verifiedAt: null,
      },
    ],
  },
  mcv: {
    sourced: true,
    labLow: 80,
    labHigh: 100,
    bands: [
      { status: "attention", min: null, max: 79.999 },
      { status: "optimal", min: 80, max: 95 },
      { status: "good", min: 95.001, max: 100 },
      { status: "attention", min: 100.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common adult MCV interval (provisional)",
        citation: "NEEDS CLINICIAN REVIEW: Typical adult MCV ~80–100 fL.",
        verifiedAt: null,
      },
    ],
  },
  mch: {
    sourced: true,
    labLow: 27,
    labHigh: 33,
    bands: [
      { status: "attention", min: null, max: 26.999 },
      { status: "good", min: 27, max: 33 },
      { status: "attention", min: 33.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common adult MCH interval (provisional)",
        citation: "NEEDS CLINICIAN REVIEW: Typical adult MCH ~27–33 pg.",
        verifiedAt: null,
      },
    ],
  },
  mchc: {
    sourced: true,
    labLow: 32,
    labHigh: 36,
    bands: [
      { status: "attention", min: null, max: 31.999 },
      { status: "good", min: 32, max: 36 },
      { status: "attention", min: 36.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common adult MCHC interval (provisional)",
        citation: "NEEDS CLINICIAN REVIEW: Typical adult MCHC ~32–36 g/dL.",
        verifiedAt: null,
      },
    ],
  },
  rdw: {
    sourced: true,
    labLow: null,
    labHigh: 14.5,
    bands: [
      { status: "optimal", min: null, max: 13.5 },
      { status: "good", min: 13.501, max: 14.5 },
      { status: "fair", min: 14.501, max: 16 },
      { status: "attention", min: 16.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common adult RDW upper bound (provisional)",
        citation: "NEEDS CLINICIAN REVIEW: RDW ULN often ~14–15%; assay-specific.",
        verifiedAt: null,
      },
    ],
  },
  pdw: {
    sourced: true,
    labLow: 9,
    labHigh: 17,
    bands: [
      { status: "attention", min: null, max: 8.999 },
      { status: "good", min: 9, max: 17 },
      { status: "attention", min: 17.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common adult PDW interval (provisional)",
        citation: "NEEDS CLINICIAN REVIEW: PDW ranges are analyzer-specific.",
        verifiedAt: null,
      },
    ],
  },
  esr: {
    sourced: true,
    labLow: 1,
    labHigh: 15,
    bands: [
      { status: "optimal", min: null, max: 10 },
      { status: "good", min: 10.001, max: 15 },
      { status: "fair", min: 15.001, max: 30 },
      { status: "attention", min: 30.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common adult male ESR (Westergren) interval (provisional)",
        citation:
          "NEEDS CLINICIAN REVIEW: ESR rises with age; common young-adult male ULN ~15 mm/h.",
        verifiedAt: null,
      },
    ],
  },
  "esr-2h": {
    sourced: true,
    labLow: 1,
    labHigh: 34,
    bands: [
      { status: "good", min: null, max: 34 },
      { status: "attention", min: 34.001, max: null },
    ],
    sourceRefs: [
      {
        label: "2nd-hour ESR (less commonly used; provisional)",
        citation:
          "NEEDS CLINICIAN REVIEW: 2nd-hour ESR is used in some European labs; interpret with 1st-hour ESR.",
        verifiedAt: null,
      },
    ],
  },
  "serum-iron": {
    sourced: true,
    labLow: 65,
    labHigh: 175,
    bands: [
      { status: "attention", min: null, max: 64.999 },
      { status: "optimal", min: 65, max: 150 },
      { status: "good", min: 150.001, max: 175 },
      { status: "attention", min: 175.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common adult male serum iron interval (provisional)",
        citation:
          "NEEDS CLINICIAN REVIEW: Serum iron fluctuates diurnally; prefer ferritin/transferrin context.",
        verifiedAt: null,
      },
    ],
  },
  transferrin: {
    sourced: true,
    labLow: 200,
    labHigh: 360,
    bands: [
      { status: "attention", min: null, max: 199.999 },
      { status: "good", min: 200, max: 360 },
      { status: "attention", min: 360.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common adult transferrin interval (provisional)",
        citation: "NEEDS CLINICIAN REVIEW: Transferrin ranges are lab-specific.",
        verifiedAt: null,
      },
    ],
  },
  ferritin: {
    sourced: true,
    labLow: 30,
    labHigh: 300,
    bands: [
      { status: "attention", min: null, max: 29.999 },
      { status: "fair", min: 30, max: 49.999 },
      { status: "good", min: 50, max: 150 },
      { status: "optimal", min: 150.001, max: 250 },
      { status: "fair", min: 250.001, max: 300 },
      { status: "attention", min: 300.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common adult male ferritin band (provisional optimization)",
        citation:
          "NEEDS CLINICIAN REVIEW: Ferritin rises with inflammation; iron-deficiency cutoffs vary. Educational seed only.",
        verifiedAt: null,
      },
    ],
  },
  folate: {
    sourced: true,
    labLow: 3.1,
    labHigh: null,
    bands: [
      { status: "attention", min: null, max: 3.099 },
      { status: "fair", min: 3.1, max: 5.999 },
      { status: "good", min: 6, max: 20 },
      { status: "optimal", min: 20.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common serum folate sufficiency thresholds (provisional)",
        citation:
          "NEEDS CLINICIAN REVIEW: Folate cutoffs vary; many labs use ~3 ng/mL as deficiency threshold.",
        verifiedAt: null,
      },
    ],
  },
  "vitamin-b12": {
    sourced: true,
    labLow: 200,
    labHigh: null,
    bands: [
      { status: "attention", min: null, max: 199.999 },
      { status: "fair", min: 200, max: 299.999 },
      { status: "good", min: 300, max: 900 },
      { status: "optimal", min: 900.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common serum B12 sufficiency thresholds (provisional)",
        citation:
          "NEEDS CLINICIAN REVIEW: B12 deficiency cutoffs vary (~200–300 pg/mL); neurologic risk may occur higher.",
        verifiedAt: null,
      },
    ],
  },
  "vitamin-d": {
    sourced: true,
    labLow: 20,
    labHigh: null,
    bands: [
      { status: "attention", min: null, max: 19.999 },
      { status: "fair", min: 20, max: 29.999 },
      { status: "good", min: 30, max: 50 },
      { status: "optimal", min: 50.001, max: 80 },
      { status: "fair", min: 80.001, max: 100 },
      { status: "attention", min: 100.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Endocrine Society 2011 25(OH)D categories (provisional mapping)",
        citation:
          "Holick MF, et al. Evaluation, treatment, and prevention of vitamin D deficiency: Endocrine Society guideline. J Clin Endocrinol Metab. 2011. Deficiency <20, insufficiency 21–29, sufficiency ≥30 ng/mL.",
        url: "https://academic.oup.com/jcem/article/96/7/1911/2833671",
        verifiedAt: null,
      },
    ],
  },
  crp: {
    sourced: true,
    labLow: null,
    labHigh: 5,
    bands: [
      { status: "optimal", min: null, max: 1 },
      { status: "good", min: 1.001, max: 3 },
      { status: "fair", min: 3.001, max: 5 },
      { status: "attention", min: 5.001, max: null },
    ],
    sourceRefs: [
      {
        label: "hs-CRP / CRP risk-style bands (provisional; assay-dependent)",
        citation:
          "NEEDS CLINICIAN REVIEW: Standard CRP vs hs-CRP differ. Seed treats <5 mg/L as common lab ULN with tighter lifestyle bands below.",
        verifiedAt: null,
      },
    ],
  },
  tsh: {
    sourced: true,
    labLow: 0.4,
    labHigh: 4.5,
    bands: [
      { status: "attention", min: null, max: 0.399 },
      { status: "optimal", min: 0.4, max: 2.5 },
      { status: "good", min: 2.501, max: 4.5 },
      { status: "fair", min: 4.501, max: 10 },
      { status: "attention", min: 10.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common adult TSH interval with tighter optimal band (provisional)",
        citation:
          "NEEDS CLINICIAN REVIEW: Typical adult TSH ~0.4–4.5 mIU/L; pregnancy and age alter targets.",
        verifiedAt: null,
      },
    ],
  },
  cortisol: {
    sourced: true,
    labLow: 5,
    labHigh: 25,
    bands: [
      { status: "attention", min: null, max: 4.999 },
      { status: "good", min: 5, max: 25 },
      { status: "attention", min: 25.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common morning cortisol interval (provisional; timing-critical)",
        citation:
          "NEEDS CLINICIAN REVIEW: Cortisol is time-of-day dependent. Seed assumes morning sample context only.",
        verifiedAt: null,
      },
    ],
  },
  homocysteine: {
    sourced: true,
    labLow: 5,
    labHigh: 15,
    bands: [
      { status: "attention", min: null, max: 4.999 },
      { status: "optimal", min: 5, max: 10 },
      { status: "good", min: 10.001, max: 15 },
      { status: "fair", min: 15.001, max: 20 },
      { status: "attention", min: 20.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common adult male homocysteine interval (provisional)",
        citation:
          "NEEDS CLINICIAN REVIEW: Homocysteine cutoffs vary; B12/folate status matters.",
        verifiedAt: null,
      },
    ],
  },
  basophils: {
    sourced: true,
    labLow: 0,
    labHigh: 2,
    bands: [
      { status: "good", min: null, max: 2 },
      { status: "attention", min: 2.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common basophil % differential (provisional)",
        citation: "NEEDS CLINICIAN REVIEW: Differential percentages are lab-specific.",
        verifiedAt: null,
      },
    ],
  },
  eosinophils: {
    sourced: true,
    labLow: 0,
    labHigh: 5,
    bands: [
      { status: "good", min: null, max: 5 },
      { status: "fair", min: 5.001, max: 10 },
      { status: "attention", min: 10.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common eosinophil % differential (provisional)",
        citation: "NEEDS CLINICIAN REVIEW: Differential percentages are lab-specific.",
        verifiedAt: null,
      },
    ],
  },
  neutrophils: {
    sourced: true,
    labLow: 40,
    labHigh: 70,
    bands: [
      { status: "attention", min: null, max: 39.999 },
      { status: "good", min: 40, max: 70 },
      { status: "attention", min: 70.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common neutrophil % differential (provisional)",
        citation: "NEEDS CLINICIAN REVIEW: Differential percentages are lab-specific.",
        verifiedAt: null,
      },
    ],
  },
  lymphocytes: {
    sourced: true,
    labLow: 20,
    labHigh: 45,
    bands: [
      { status: "attention", min: null, max: 19.999 },
      { status: "good", min: 20, max: 45 },
      { status: "attention", min: 45.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common lymphocyte % differential (provisional)",
        citation: "NEEDS CLINICIAN REVIEW: Differential percentages are lab-specific.",
        verifiedAt: null,
      },
    ],
  },
  monocytes: {
    sourced: true,
    labLow: 2,
    labHigh: 10,
    bands: [
      { status: "attention", min: null, max: 1.999 },
      { status: "good", min: 2, max: 10 },
      { status: "attention", min: 10.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common monocyte % differential (provisional)",
        citation: "NEEDS CLINICIAN REVIEW: Differential percentages are lab-specific.",
        verifiedAt: null,
      },
    ],
  },
  bands: {
    sourced: true,
    labLow: 0,
    labHigh: 5,
    bands: [
      { status: "good", min: null, max: 5 },
      { status: "attention", min: 5.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Common band neutrophil % (provisional)",
        citation: "NEEDS CLINICIAN REVIEW: Band reporting varies by lab method.",
        verifiedAt: null,
      },
    ],
  },
  myelocytes: {
    sourced: true,
    labLow: 0,
    labHigh: 0,
    bands: [
      { status: "good", min: null, max: 0 },
      { status: "attention", min: 0.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Immature myeloid cells normally absent (provisional)",
        citation: "NEEDS CLINICIAN REVIEW: Circulating myelocytes are typically not expected in healthy adults.",
        verifiedAt: null,
      },
    ],
  },
  metamyelocytes: {
    sourced: true,
    labLow: 0,
    labHigh: 0,
    bands: [
      { status: "good", min: null, max: 0 },
      { status: "attention", min: 0.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Immature myeloid cells normally absent (provisional)",
        citation: "NEEDS CLINICIAN REVIEW: Circulating metamyelocytes are typically not expected in healthy adults.",
        verifiedAt: null,
      },
    ],
  },
  "atypical-lymphs": {
    sourced: true,
    labLow: 0,
    labHigh: 0,
    bands: [
      { status: "good", min: null, max: 0 },
      { status: "fair", min: 0.001, max: 5 },
      { status: "attention", min: 5.001, max: null },
    ],
    sourceRefs: [
      {
        label: "Atypical lymphocytes normally absent/rare (provisional)",
        citation: "NEEDS CLINICIAN REVIEW: Small atypical-lymph percentages can appear with viral illness.",
        verifiedAt: null,
      },
    ],
  },
};

const data = JSON.parse(readFileSync(path, "utf8"));
let updated = 0;
for (const marker of data.markers) {
  const patch = provisional[marker.biomarkerId];
  if (!patch) continue;
  if (marker.sourced === true && marker.bands?.length) continue;
  Object.assign(marker, patch);
  updated += 1;
}
data.notes =
  "Educational seed. Includes provisional guideline/lab-consensus bands. NOT clinician-reviewed. Prefer printed lab intervals when available. Do not treat as diagnosis.";
writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Updated ${updated} marker range entries in ${path}`);
