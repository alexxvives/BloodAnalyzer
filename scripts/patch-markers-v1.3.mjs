/**
 * One-shot: replace unsourced PANEL_CATALOG placeholders with cited ranges.
 * Run from repo root: node scripts/patch-markers-v1.3.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data/reference-ranges/v1/markers.json");
const data = JSON.parse(readFileSync(path, "utf8"));

const VERIFIED = "2026-08-23";
const BAND_POLICY = {
  label: "How these bands were built",
  citation:
    "Band policy (sourced boundaries only): when the only sourced numbers are a reference interval's two endpoints, bands are attention / good / attention. No source defines an optimum inside this interval.",
  url: null,
  verifiedAt: VERIFIED,
};

function below(x) {
  return Number((x - 0.001).toFixed(3));
}
function above(x) {
  return Number((x + 0.001).toFixed(3));
}

function riBands(low, high) {
  return [
    { status: "attention", min: null, max: below(low) },
    { status: "good", min: low, max: high },
    { status: "attention", min: above(high), max: null },
  ];
}

function oneSidedHigh(high) {
  return [
    { status: "good", min: null, max: high },
    { status: "attention", min: above(high), max: null },
  ];
}

function oneSidedLow(low) {
  return [
    { status: "attention", min: null, max: below(low) },
    { status: "good", min: low, max: null },
  ];
}

function mayo(label, citation, url) {
  return [
    { label, citation, url, verifiedAt: VERIFIED },
    BAND_POLICY,
  ];
}

function placeholder(id, name, subtitle, sectionId, unit, extra = {}) {
  return {
    biomarkerId: id,
    name,
    subtitle,
    sectionId,
    unit,
    sourced: false,
    labLow: null,
    labHigh: null,
    bands: [],
    sourceRefs: [
      {
        label: "Panel catalog placeholder — range not yet sourced",
        citation:
          "Shown as not-tested when absent from an upload. Optimization bands require a cited source before grading.",
        verifiedAt: null,
      },
    ],
    ...extra,
  };
}

const REPLACE = new Set([
  "apo-b",
  "hba1c",
  "insulin",
  "egfr",
  "alp",
  "bilirubin-total",
  "albumin",
  "free-t3",
  "free-t4",
  "testosterone",
  "free-testosterone",
  "shbg",
  "estradiol",
  "dhea-s",
  "fsh",
  "lh",
  "prolactin",
  "psa",
  "tibc",
  "omega-3-index",
  "bilirubin-direct",
  "total-protein",
  "tpoab",
  "tgab",
]);

const newRows = [];

function row(partial) {
  newRows.push(partial);
}

row({
  biomarkerId: "apo-b",
  name: "ApoB",
  subtitle: "Apolipoprotein B — atherogenic particle count",
  sectionId: "lipid",
  unit: "mg/dL",
  loincCode: "1884-6",
  sourced: true,
  labLow: 48,
  labHigh: 90,
  bands: [
    { status: "attention", min: null, max: 47.999 },
    { status: "optimal", min: 48, max: 89.999 },
    { status: "good", min: 90, max: 99.999 },
    { status: "fair", min: 100, max: 119.999 },
    { status: "attention", min: 120, max: null },
  ],
  sourceRefs: [
    {
      label:
        "Mayo Clinic Laboratories APOLB — adult ApoB desirable <90, above desirable 90-99, borderline high 100-119, high 120-139, very high >=140; very low <48",
      citation:
        "Mayo Clinic Laboratories, test APOLB (Apolipoprotein B, Serum), adults >=18 years: Desirable <90 mg/dL; Above Desirable 90-99; Borderline high 100-119; High 120-139; Very high >=140. Values <48 mg/dL are considered very low (<2.5th percentile). Mapped here as attention <48 / optimal 48-89 / good 90-99 / fair 100-119 / attention >=120. ACC/AHA 2018 treats ApoB >=130 mg/dL as a risk-enhancing factor, which sits inside Mayo's High band.",
      url: "https://www.mayocliniclabs.com/test-catalog/Overview/614544",
      verifiedAt: VERIFIED,
    },
    {
      label:
        "2018 AHA/ACC cholesterol guideline — ApoB >=130 mg/dL is a risk-enhancing factor (corresponds to LDL-C >=160)",
      citation:
        "Grundy SM et al. 2018 AHA/ACC/Multisociety Guideline on the Management of Blood Cholesterol. Circulation. 2019. ApoB >=130 mg/dL is listed as a risk-enhancing factor; it does not by itself define the interior bands, which come from Mayo APOLB.",
      url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000625",
      verifiedAt: VERIFIED,
    },
  ],
  demographic: { ageMin: 18 },
});

row({
  biomarkerId: "hba1c",
  name: "HbA1c",
  subtitle: "Average blood sugar over ~3 months",
  sectionId: "metabolic",
  unit: "%",
  loincCode: "4548-4",
  sourced: true,
  labLow: 4.0,
  labHigh: 5.6,
  bands: [
    { status: "attention", min: null, max: 3.999 },
    { status: "optimal", min: 4.0, max: 5.6 },
    { status: "fair", min: 5.7, max: 6.4 },
    { status: "attention", min: 6.5, max: null },
  ],
  sourceRefs: [
    {
      label:
        "Mayo HBA1C reference 4.0-5.6% plus ADA diagnostic categories (prediabetes 5.7-6.4, diabetes >=6.5)",
      citation:
        "Mayo Clinic Laboratories, test HBA1C (Hemoglobin A1c, Blood): reference interval 4.0-5.6%. For adults >=18 years Mayo also reports ADA interpretive cutoffs: increased risk for diabetes (prediabetes) 5.7-6.4%; diabetes >=6.5%. Bands map those published cutpoints: attention <4.0 / optimal 4.0-5.6 / fair 5.7-6.4 / attention >=6.5. No unpublished interior (e.g. <5.0) is claimed. ADA treatment targets for diagnosed diabetes (<7%) are a separate clinical goal and are not used as the optimization grade here.",
      url: "https://www.mayocliniclabs.com/test-catalog/overview/82080",
      verifiedAt: VERIFIED,
    },
    {
      label:
        "ADA Standards of Care — Diagnosis and Classification of Diabetes (A1C 5.7-6.4 prediabetes, >=6.5 diabetes)",
      citation:
        "American Diabetes Association. 2. Diagnosis and Classification of Diabetes: Standards of Care in Diabetes. Diabetes Care (annual). Prediabetes A1C 5.7-6.4% (39-47 mmol/mol); diabetes >=6.5% (48 mmol/mol).",
      url: "https://diabetesjournals.org/care/article/49/Supplement_1/S27/163926/2-Diagnosis-and-Classification-of-Diabetes",
      verifiedAt: VERIFIED,
    },
  ],
});

row({
  biomarkerId: "insulin",
  name: "Insulin",
  subtitle: "Fasting insulin",
  sectionId: "metabolic",
  unit: "uIU/mL",
  loincCode: "20448-7",
  sourced: true,
  labLow: 2.6,
  labHigh: 24.9,
  bands: riBands(2.6, 24.9),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories INS — fasting insulin 2.6-24.9 mcIU/mL",
    "Mayo Clinic Laboratories, test INS (Insulin, Serum). Fasting reference interval 2.6-24.9 mcIU/mL (≡ uIU/mL). 8-hour fast required. Bands are attention / good / attention at those endpoints; Mayo does not define an interior optimum or HOMA-IR cutpoint.",
    "https://www.mayocliniclabs.com/test-catalog/Overview/800257",
  ),
});

row({
  biomarkerId: "egfr",
  name: "eGFR",
  subtitle: "Estimated glomerular filtration rate",
  sectionId: "kidney",
  unit: "mL/min/1.73m²",
  loincCode: "98979-8",
  sourced: true,
  labLow: 60,
  labHigh: null,
  bands: [
    { status: "attention", min: null, max: 29.999 },
    { status: "fair", min: 30, max: 59.999 },
    { status: "good", min: 60, max: 89.999 },
    { status: "optimal", min: 90, max: null },
  ],
  sourceRefs: [
    {
      label:
        "KDIGO 2024 CKD Guideline Table 2 — G1 >=90 normal or high, G2 60-89 mildly decreased, G3 30-59, G4-G5 <30",
      citation:
        "Kidney Disease: Improving Global Outcomes (KDIGO) CKD Work Group. KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024. GFR categories: G1 >=90 (normal or high); G2 60-89 (mildly decreased); G3a 45-59 / G3b 30-44 (mapped together as fair); G4 15-29 / G5 <15 (mapped together as attention). Lab flag uses <60, the GFR threshold that with duration >3 months indicates CKD in the absence of other kidney-damage markers. G1/G2 alone do not fulfill CKD criteria without markers of kidney damage.",
      url: "https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf",
      verifiedAt: VERIFIED,
    },
  ],
});

row({
  biomarkerId: "alp",
  name: "Alkaline Phosphatase",
  subtitle: "Liver and bone enzyme",
  sectionId: "liver",
  unit: "U/L",
  loincCode: "6768-6",
  sourced: true,
  labLow: 40,
  labHigh: 129,
  bands: riBands(40, 129),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories ALP — adult male >=19 years 40-129 U/L",
    "Mayo Clinic Laboratories, test ALP (Alkaline Phosphatase, Serum). Males >=19 years: 40-129 U/L. Pediatric intervals differ and are not used here. Bands are attention / good / attention at those endpoints.",
    "https://www.mayocliniclabs.com/test-catalog/overview/8340",
  ),
  demographic: { sex: "male", ageMin: 19 },
});

row({
  biomarkerId: "alp",
  name: "Alkaline Phosphatase",
  subtitle: "Liver and bone enzyme",
  sectionId: "liver",
  unit: "U/L",
  loincCode: "6768-6",
  sourced: true,
  labLow: 35,
  labHigh: 104,
  bands: riBands(35, 104),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories ALP — adult female >=17 years 35-104 U/L",
    "Mayo Clinic Laboratories, test ALP (Alkaline Phosphatase, Serum). Females >=17 years: 35-104 U/L. Bands are attention / good / attention at those endpoints.",
    "https://www.mayocliniclabs.com/test-catalog/overview/8340",
  ),
  demographic: { sex: "female", ageMin: 17 },
});

row({
  biomarkerId: "bilirubin-total",
  name: "Total Bilirubin",
  subtitle: "Liver pigment from heme breakdown",
  sectionId: "liver",
  unit: "mg/dL",
  loincCode: "1975-2",
  sourced: true,
  labLow: 0,
  labHigh: 1.2,
  bands: oneSidedHigh(1.2),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories BILIT — adults >=18 years total bilirubin 0.0-1.2 mg/dL",
    "Mayo Clinic Laboratories, test BILIT (Bilirubin, Total, Serum). Adults >=18 years: 0.0-1.2 mg/dL. Lower values are not flagged; bands are good through 1.2 / attention above. Neonatal intervals are excluded.",
    "https://www.mayocliniclabs.com/test-catalog/overview/81785",
  ),
  demographic: { ageMin: 18 },
});

row({
  biomarkerId: "albumin",
  name: "Albumin",
  subtitle: "Major blood protein",
  sectionId: "liver",
  unit: "g/dL",
  loincCode: "1751-7",
  sourced: true,
  labLow: 3.5,
  labHigh: 5.0,
  bands: riBands(3.5, 5.0),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories ALB — >=12 months albumin 3.5-5.0 g/dL",
    "Mayo Clinic Laboratories, test ALB (Albumin, Serum). >=12 months: 3.5-5.0 g/dL. Bands are attention / good / attention at those endpoints.",
    "https://www.mayocliniclabs.com/test-catalog/overview/8436",
  ),
  demographic: { ageMin: 1 },
});

row({
  biomarkerId: "free-t3",
  name: "Free T3",
  subtitle: "Unbound triiodothyronine",
  sectionId: "thyroid",
  unit: "pg/mL",
  loincCode: "3051-0",
  sourced: true,
  labLow: 2.0,
  labHigh: 4.4,
  bands: riBands(2.0, 4.4),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories T3FR — adult >=19 years free T3 2.0-4.4 pg/mL",
    "Mayo Clinic Laboratories, test T3FR (T3 Free, Serum). Adult (>=19 years): 2.0-4.4 pg/mL. Pediatric intervals differ and are not used here. Bands are attention / good / attention at those endpoints.",
    "https://www.mayocliniclabs.com/test-catalog/overview/621321",
  ),
  demographic: { ageMin: 19 },
});

row({
  biomarkerId: "free-t4",
  name: "Free T4",
  subtitle: "Unbound thyroxine",
  sectionId: "thyroid",
  unit: "ng/dL",
  loincCode: "3024-7",
  sourced: true,
  labLow: 0.9,
  labHigh: 1.7,
  bands: riBands(0.9, 1.7),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories FRT4 — adult >=20 years free T4 0.9-1.7 ng/dL",
    "Mayo Clinic Laboratories, test FRT4 (T4 Free, Serum). Adult (>=20 years): 0.9-1.7 ng/dL. Pediatric intervals differ and are not used here. Bands are attention / good / attention at those endpoints.",
    "https://www.mayocliniclabs.com/test-catalog/overview/8725",
  ),
  demographic: { ageMin: 20 },
});

row({
  biomarkerId: "testosterone",
  name: "Testosterone",
  subtitle: "Total testosterone",
  sectionId: "hormones",
  unit: "ng/dL",
  loincCode: "2986-8",
  sourced: true,
  labLow: 240,
  labHigh: 950,
  bands: riBands(240, 950),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories TTST — adult male >=19 years total testosterone 240-950 ng/dL",
    "Mayo Clinic Laboratories, test TTST (Testosterone, Total, Mass Spectrometry, Serum). Males >=19 years: 240-950 ng/dL. Pediatric and Tanner-stage intervals are not used here. Bands are attention / good / attention at those endpoints; Mayo does not define an interior optimum.",
    "https://www.mayocliniclabs.com/test-catalog/Overview/8533",
  ),
  demographic: { sex: "male", ageMin: 19 },
});

row({
  biomarkerId: "testosterone",
  name: "Testosterone",
  subtitle: "Total testosterone",
  sectionId: "hormones",
  unit: "ng/dL",
  loincCode: "2986-8",
  sourced: true,
  labLow: 8,
  labHigh: 60,
  bands: riBands(8, 60),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories TTST — adult female >=19 years total testosterone 8-60 ng/dL",
    "Mayo Clinic Laboratories, test TTST (Testosterone, Total, Mass Spectrometry, Serum). Females >=19 years: 8-60 ng/dL. Bands are attention / good / attention at those endpoints.",
    "https://www.mayocliniclabs.com/test-catalog/Overview/8533",
  ),
  demographic: { sex: "female", ageMin: 19 },
});

// Free testosterone: Mayo ng/dL × 10 = pg/mL (catalog unit).
const maleFreeT = [
  [20, 24, 5.25, 20.7],
  [25, 29, 5.05, 19.8],
  [30, 34, 4.85, 19.0],
  [35, 39, 4.65, 18.1],
  [40, 44, 4.46, 17.1],
  [45, 49, 4.26, 16.4],
  [50, 54, 4.06, 15.6],
  [55, 59, 3.87, 14.7],
  [60, 64, 3.67, 13.9],
  [65, 69, 3.47, 13.0],
];
for (const [ageMin, ageMax, lowNg, highNg] of maleFreeT) {
  const low = Number((lowNg * 10).toFixed(1));
  const high = Number((highNg * 10).toFixed(1));
  row({
    biomarkerId: "free-testosterone",
    name: "Free Testosterone",
    subtitle: "Unbound testosterone",
    sectionId: "hormones",
    unit: "pg/mL",
    sourced: true,
    labLow: low,
    labHigh: high,
    bands: riBands(low, high),
    sourceRefs: mayo(
      `Mayo Clinic Laboratories TGRP — male ${ageMin}-<${ageMax + 1} years free testosterone ${lowNg}-${highNg} ng/dL (${low}-${high} pg/mL)`,
      `Mayo Clinic Laboratories, test TGRP / FRTST (Testosterone, Total and Free, Serum), equilibrium dialysis. Males ${ageMin}-<${ageMax + 1} years: ${lowNg}-${highNg} ng/dL. Converted to pg/mL (×10) to match this catalog's unit. Bands are attention / good / attention at those endpoints.`,
      "https://www.mayocliniclabs.com/test-catalog/overview/8508",
    ),
    demographic: { sex: "male", ageMin, ageMax },
  });
}

row({
  biomarkerId: "free-testosterone",
  name: "Free Testosterone",
  subtitle: "Unbound testosterone",
  sectionId: "hormones",
  unit: "pg/mL",
  sourced: true,
  labLow: null,
  labHigh: 10.8,
  bands: oneSidedHigh(10.8),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories TGRP — adult female 20-<25 years free testosterone <0.13-1.08 ng/dL (lab high 10.8 pg/mL)",
    "Mayo Clinic Laboratories, test TGRP / FRTST. Adult females 20-<25 years: <0.13-1.08 ng/dL. Converted to pg/mL (×10). The lower bound is an assay limit, not a clinical low, so only the high side is graded. Adjacent adult female 5-year highs decline slowly (to ~0.95 ng/dL by 45-49); this row is used for adult females 18-49.",
    "https://www.mayocliniclabs.com/test-catalog/overview/8508",
  ),
  demographic: { sex: "female", ageMin: 18, ageMax: 49 },
});

row({
  biomarkerId: "shbg",
  name: "SHBG",
  subtitle: "Sex hormone-binding globulin",
  sectionId: "hormones",
  unit: "nmol/L",
  loincCode: "13967-5",
  sourced: true,
  labLow: 13.3,
  labHigh: 89.5,
  bands: riBands(13.3, 89.5),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories SHBG1 — adult male >=18 years 13.3-89.5 nmol/L",
    "Mayo Clinic Laboratories, test SHBG1 (Sex Hormone-Binding Globulin, Serum). Adult males >=18 years: 13.3-89.5 nmol/L. Bands are attention / good / attention at those endpoints.",
    "https://www.mayocliniclabs.com/test-catalog/Overview/608102",
  ),
  demographic: { sex: "male", ageMin: 18 },
});

row({
  biomarkerId: "shbg",
  name: "SHBG",
  subtitle: "Sex hormone-binding globulin",
  sectionId: "hormones",
  unit: "nmol/L",
  loincCode: "13967-5",
  sourced: true,
  labLow: 18.2,
  labHigh: 135.5,
  bands: riBands(18.2, 135.5),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories SHBG1 — female 18-46 years 18.2-135.5 nmol/L",
    "Mayo Clinic Laboratories, test SHBG1. Adult females 18-46 years: 18.2-135.5 nmol/L. Pregnancy intervals are not established. Bands are attention / good / attention at those endpoints.",
    "https://www.mayocliniclabs.com/test-catalog/Overview/608102",
  ),
  demographic: { sex: "female", ageMin: 18, ageMax: 46 },
});

row({
  biomarkerId: "shbg",
  name: "SHBG",
  subtitle: "Sex hormone-binding globulin",
  sectionId: "hormones",
  unit: "nmol/L",
  loincCode: "13967-5",
  sourced: true,
  labLow: 16.8,
  labHigh: 125.2,
  bands: riBands(16.8, 125.2),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories SHBG1 — female 47-91 years (post-menopausal table) 16.8-125.2 nmol/L",
    "Mayo Clinic Laboratories, test SHBG1. Females 47-91 years, labeled post-menopausal: 16.8-125.2 nmol/L. Applied here by age, not by confirmed menopausal status. Bands are attention / good / attention at those endpoints.",
    "https://www.mayocliniclabs.com/test-catalog/Overview/608102",
  ),
  demographic: { sex: "female", ageMin: 47, ageMax: 91 },
});

row({
  biomarkerId: "estradiol",
  name: "Estradiol",
  subtitle: "Primary estrogen",
  sectionId: "hormones",
  unit: "pg/mL",
  loincCode: "2243-4",
  sourced: true,
  labLow: 10,
  labHigh: 40,
  bands: riBands(10, 40),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories EEST — adult male estradiol 10-40 pg/mL",
    "Mayo Clinic Laboratories, test EEST (Estradiol, Serum). Adult males: 10-40 pg/mL. Female premenopausal values vary by cycle phase (15-350 pg/mL) and are not graded without cycle day — see the unsourced female placeholder row.",
    "https://www.mayocliniclabs.com/test-catalog/overview/81816",
  ),
  demographic: { sex: "male", ageMin: 18 },
});

row(
  placeholder(
    "estradiol",
    "Estradiol",
    "Primary estrogen",
    "hormones",
    "pg/mL",
    {
      loincCode: "2243-4",
      sourceRefs: [
        {
          label: "Female estradiol not graded without cycle phase",
          citation:
            "Mayo EEST lists premenopausal 15-350 pg/mL spanning follicular through luteal peaks, and postmenopausal <10 pg/mL. This product does not collect cycle day or menopausal status, so a female row cannot be graded without inventing a phase. Male adults are graded separately.",
          url: "https://www.mayocliniclabs.com/test-catalog/overview/81816",
          verifiedAt: VERIFIED,
        },
      ],
      demographic: { sex: "female" },
    },
  ),
);

const dhea = {
  male: [
    [18, 30, 105, 728],
    [31, 40, 57, 522],
    [41, 50, 34, 395],
    [51, 60, 20, 299],
    [61, 70, 12, 227],
    [71, null, 6.6, 162],
  ],
  female: [
    [18, 30, 83, 377],
    [31, 40, 45, 295],
    [41, 50, 27, 240],
    [51, 60, 16, 195],
    [61, 70, 9.7, 159],
    [71, null, 5.3, 124],
  ],
};
for (const [sex, bands] of Object.entries(dhea)) {
  for (const [ageMin, ageMax, low, high] of bands) {
    const ageLabel =
      ageMax == null ? `>=${ageMin}` : `${ageMin}-${ageMax}`;
    row({
      biomarkerId: "dhea-s",
      name: "DHEA-S",
      subtitle: "Dehydroepiandrosterone sulfate",
      sectionId: "hormones",
      unit: "ug/dL",
      loincCode: "2191-5",
      sourced: true,
      labLow: low,
      labHigh: high,
      bands: riBands(low, high),
      sourceRefs: mayo(
        `Mayo Clinic Laboratories DHES1 — ${sex} ${ageLabel} years ${low}-${high} mcg/dL`,
        `Mayo Clinic Laboratories, test DHES1 (Dehydroepiandrosterone Sulfate, Serum). ${sex === "male" ? "Males" : "Females"} ${ageLabel} years: ${low}-${high} mcg/dL (≡ ug/dL). Bands are attention / good / attention at those endpoints.`,
        "https://www.mayocliniclabs.com/test-catalog/Overview/113594",
      ),
      demographic: {
        sex,
        ageMin,
        ...(ageMax != null ? { ageMax } : {}),
      },
    });
  }
}

row({
  biomarkerId: "fsh",
  name: "FSH",
  subtitle: "Follicle-stimulating hormone",
  sectionId: "hormones",
  unit: "mIU/mL",
  loincCode: "15067-2",
  sourced: true,
  labLow: 1.2,
  labHigh: 15.8,
  bands: riBands(1.2, 15.8),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories FSH — adult male >18 years 1.2-15.8 IU/L",
    "Mayo Clinic Laboratories, test FSH (Follicle-Stimulating Hormone, Serum). Males >18 years: 1.2-15.8 IU/L (≡ mIU/mL). Female cycle-phase intervals are not graded without cycle day — see the unsourced female placeholder row.",
    "https://www.mayocliniclabs.com/test-catalog/overview/602753",
  ),
  demographic: { sex: "male", ageMin: 19 },
});

row(
  placeholder("fsh", "FSH", "Follicle-stimulating hormone", "hormones", "mIU/mL", {
    loincCode: "15067-2",
    sourceRefs: [
      {
        label: "Female FSH not graded without cycle phase",
        citation:
          "Mayo FSH publishes separate follicular, midcycle, luteal, and postmenopausal female intervals. This product does not collect cycle day or menopausal status, so a female row cannot be graded without inventing a phase. Male adults are graded separately.",
        url: "https://www.mayocliniclabs.com/test-catalog/overview/602753",
        verifiedAt: VERIFIED,
      },
    ],
    demographic: { sex: "female" },
  }),
);

row({
  biomarkerId: "lh",
  name: "LH",
  subtitle: "Luteinizing hormone",
  sectionId: "hormones",
  unit: "mIU/mL",
  loincCode: "10501-5",
  sourced: true,
  labLow: 1.3,
  labHigh: 9.6,
  bands: riBands(1.3, 9.6),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories LH — adult male >18 years 1.3-9.6 IU/L",
    "Mayo Clinic Laboratories, test LH (Luteinizing Hormone, Serum). Males >18 years: 1.3-9.6 IU/L (≡ mIU/mL). Female cycle-phase intervals (follicular 1.9-14.6, midcycle 12.2-118.0, luteal 0.7-12.9, postmenopausal 5.3-65.4 IU/L) are not graded without cycle day.",
    "https://www.mayocliniclabs.com/test-catalog/Overview/602752",
  ),
  demographic: { sex: "male", ageMin: 19 },
});

row(
  placeholder("lh", "LH", "Luteinizing hormone", "hormones", "mIU/mL", {
    loincCode: "10501-5",
    sourceRefs: [
      {
        label: "Female LH not graded without cycle phase",
        citation:
          "Mayo LH publishes follicular, midcycle, luteal, and postmenopausal female intervals. This product does not collect cycle day or menopausal status, so a female row cannot be graded without inventing a phase. Male adults are graded separately.",
        url: "https://www.mayocliniclabs.com/test-catalog/Overview/602752",
        verifiedAt: VERIFIED,
      },
    ],
    demographic: { sex: "female" },
  }),
);

row({
  biomarkerId: "prolactin",
  name: "Prolactin",
  subtitle: "Pituitary hormone",
  sectionId: "hormones",
  unit: "ng/mL",
  loincCode: "2842-3",
  sourced: true,
  labLow: 4.0,
  labHigh: 15.2,
  bands: riBands(4.0, 15.2),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories PRL — adult male >=18 years 4.0-15.2 ng/mL",
    "Mayo Clinic Laboratories, test PRL (Prolactin, Serum). Males >=18 years: 4.0-15.2 ng/mL. Bands are attention / good / attention at those endpoints.",
    "https://www.mayocliniclabs.com/test-catalog/Overview/85670",
  ),
  demographic: { sex: "male", ageMin: 18 },
});

row({
  biomarkerId: "prolactin",
  name: "Prolactin",
  subtitle: "Pituitary hormone",
  sectionId: "hormones",
  unit: "ng/mL",
  loincCode: "2842-3",
  sourced: true,
  labLow: 4.8,
  labHigh: 23.3,
  bands: riBands(4.8, 23.3),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories PRL — adult female >=18 years 4.8-23.3 ng/mL",
    "Mayo Clinic Laboratories, test PRL (Prolactin, Serum). Females >=18 years: 4.8-23.3 ng/mL. Bands are attention / good / attention at those endpoints.",
    "https://www.mayocliniclabs.com/test-catalog/Overview/85670",
  ),
  demographic: { sex: "female", ageMin: 18 },
});

const psa = [
  [null, 39, 2.0],
  [40, 49, 2.5],
  [50, 59, 3.5],
  [60, 69, 4.5],
  [70, 79, 6.5],
  [80, null, 7.2],
];
for (const [ageMin, ageMax, high] of psa) {
  const ageLabel =
    ageMin == null
      ? "<40"
      : ageMax == null
        ? `>=${ageMin}`
        : `${ageMin}-${ageMax}`;
  row({
    biomarkerId: "psa",
    name: "PSA",
    subtitle: "Prostate-specific antigen",
    sectionId: "prostate",
    unit: "ng/mL",
    loincCode: "2857-1",
    sourced: true,
    labLow: null,
    labHigh: high,
    bands: oneSidedHigh(high),
    sourceRefs: mayo(
      `Mayo Clinic Laboratories PSAFT — male ${ageLabel} years total PSA <=${high} ng/mL`,
      `Mayo Clinic Laboratories, test PSAFT (PSA, Total and Free, Serum). Males ${ageLabel} years: <=${high} ng/mL. Females: not applicable. Lower values are not flagged. This is a screening interval, not a diagnosis of prostate disease.`,
      "https://www.mayocliniclabs.com/test-catalog/Overview/81944",
    ),
    demographic: {
      sex: "male",
      ...(ageMin != null ? { ageMin } : {}),
      ...(ageMax != null ? { ageMax } : {}),
    },
  });
}

row({
  biomarkerId: "tibc",
  name: "TIBC",
  subtitle: "Total iron-binding capacity",
  sectionId: "vitamins",
  unit: "ug/dL",
  loincCode: "2500-7",
  sourced: true,
  labLow: 250,
  labHigh: 400,
  bands: riBands(250, 400),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories SFEC/TIBC — total iron-binding capacity 250-400 mcg/dL",
    "Mayo Clinic Laboratories, test TIBC as part of SFEC (Iron and Total Iron-Binding Capacity, Serum). Reference interval 250-400 mcg/dL (≡ ug/dL). TIBC = transferrin × 1.18. Bands are attention / good / attention at those endpoints.",
    "https://www.mayocliniclabs.com/test-catalog/overview/2501",
  ),
});

row({
  biomarkerId: "omega-3-index",
  name: "Omega-3 Index",
  subtitle: "EPA + DHA in red blood cells",
  sectionId: "vitamins",
  unit: "%",
  sourced: true,
  labLow: 4,
  labHigh: null,
  bands: [
    { status: "attention", min: null, max: 4 },
    { status: "fair", min: 4.001, max: 7.999 },
    { status: "optimal", min: 8, max: null },
  ],
  sourceRefs: [
    {
      label:
        "Harris & von Schacky 2004 — Omega-3 Index <=4% least cardioprotection, >=8% greatest (intermediate 4-8%)",
      citation:
        "Harris WS, von Schacky C. The Omega-3 Index: a new risk factor for death from coronary heart disease? Prev Med. 2004;39:212-220. An Omega-3 Index >=8% was associated with the greatest cardioprotection, whereas <=4% was associated with the least. The 4-8% zone is the published intermediate band. Mapped here as attention <=4 / fair 4-8 / optimal >=8. This is a proposed risk marker, not a CLSI reference interval.",
      url: "https://doi.org/10.1016/j.ypmed.2004.02.030",
      verifiedAt: VERIFIED,
    },
  ],
});

row({
  biomarkerId: "bilirubin-direct",
  name: "Direct Bilirubin",
  subtitle: "Conjugated bilirubin",
  sectionId: "liver",
  unit: "mg/dL",
  loincCode: "1968-7",
  sourced: true,
  labLow: 0,
  labHigh: 0.3,
  bands: oneSidedHigh(0.3),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories BILID — >=12 months direct bilirubin 0.0-0.3 mg/dL",
    "Mayo Clinic Laboratories, test BILID (Bilirubin, Direct, Serum). >=12 months: 0.0-0.3 mg/dL. Lower values are not flagged; bands are good through 0.3 / attention above.",
    "https://www.mayocliniclabs.com/test-catalog/overview/8452",
  ),
  demographic: { ageMin: 1 },
});

row({
  biomarkerId: "total-protein",
  name: "Total Protein",
  subtitle: "Serum total protein",
  sectionId: "liver",
  unit: "g/dL",
  loincCode: "2885-2",
  sourced: true,
  labLow: 6.3,
  labHigh: 7.9,
  bands: riBands(6.3, 7.9),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories TP — >=1 year total protein 6.3-7.9 g/dL",
    "Mayo Clinic Laboratories, test TP (Protein, Total, Serum). >=1 year: 6.3-7.9 g/dL. Bands are attention / good / attention at those endpoints.",
    "https://www.mayocliniclabs.com/test-catalog/Overview/8520",
  ),
  demographic: { ageMin: 1 },
});

row({
  biomarkerId: "tpoab",
  name: "TPO Antibodies",
  subtitle: "Thyroperoxidase antibodies",
  sectionId: "thyroid",
  unit: "IU/mL",
  loincCode: "8099-4",
  sourced: true,
  labLow: null,
  labHigh: 9.0,
  bands: oneSidedHigh(9.0),
  sourceRefs: [
    {
      label:
        "Mayo Clinic Laboratories TPO — thyroperoxidase antibodies <9.0 IU/mL (Access TPO assay)",
      citation:
        "Mayo Clinic Laboratories, test TPO (Thyroperoxidase Antibodies, Serum). Reference value <9.0 IU/mL on the Beckman Access TPO assay (WHO 66/387). Antibody cutoffs are assay-specific; this interval does not transfer to other methods. Bands are good through 9.0 / attention above. Not a diagnosis of autoimmune thyroid disease.",
      url: "https://www.mayocliniclabs.com/test-catalog/overview/81765",
      verifiedAt: VERIFIED,
    },
    BAND_POLICY,
  ],
});

row({
  biomarkerId: "tgab",
  name: "Thyroglobulin Antibodies",
  subtitle: "Thyroglobulin antibodies",
  sectionId: "thyroid",
  unit: "IU/mL",
  loincCode: "8098-6",
  sourced: true,
  labLow: null,
  labHigh: 4.0,
  bands: oneSidedHigh(4.0),
  sourceRefs: [
    {
      label:
        "Mayo Clinic Laboratories TAB — thyroglobulin antibody <4.0 IU/mL (thyroid autoantibodies profile)",
      citation:
        "Mayo Clinic Laboratories, test TAB (Thyroid Autoantibodies Profile, Serum). Thyroglobulin antibody <4.0 IU/mL. A separate Mayo thyroglobulin-antibody method (TGABI) uses <1.8 IU/mL — cutoffs are assay-specific and this row cites the TAB screening profile only. Bands are good through 4.0 / attention above.",
      url: "https://www.mayocliniclabs.com/test-catalog/Overview/82041",
      verifiedAt: VERIFIED,
    },
    BAND_POLICY,
  ],
});

data.markers = data.markers.filter((m) => !REPLACE.has(m.biomarkerId));
data.markers.push(...newRows);
data.version = "1.3.0";
data.notes =
  "Educational seed. NOT clinician-reviewed. Prefer printed lab intervals when available. Do not treat as diagnosis. v1.3.0: sourced the next PANEL_CATALOG batch from Mayo (insulin, ALP, bilirubin, albumin, free T3/T4, testosterone, free testosterone, SHBG, DHEA-S, prolactin, PSA, TIBC, TPO/TgAb, male estradiol/FSH/LH), ADA+Mayo HbA1c, Mayo+ACC ApoB, KDIGO eGFR, and Harris 2004 Omega-3 Index. Female cycle-phase estradiol/FSH/LH stay unsourced. Calculated ratios, UIBC, VLDL, and eAG remain placeholders. v1.2.3: Mayo BUN for urea id. See data/SOURCES.md.";

writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
console.log(
  `Wrote ${newRows.length} replacement rows; markers now ${data.markers.length}`,
);
