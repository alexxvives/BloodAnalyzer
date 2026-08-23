/**
 * Source the next NEEDS-CLINICIAN-REVIEW batch that has a named catalog or
 * guideline page. Run from repo root: node scripts/patch-markers-v1.3.3.mjs
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

const REPLACE = new Set(["tsh", "cortisol", "folate", "crp", "lp-a"]);
const newRows = [];

newRows.push({
  biomarkerId: "tsh",
  name: "TSH",
  subtitle: "Thyroid-stimulating hormone",
  sectionId: "thyroid",
  unit: "uU/mL",
  loincCode: "11579-0",
  sourced: true,
  labLow: 0.3,
  labHigh: 4.2,
  bands: riBands(0.3, 4.2),
  sourceRefs: mayo(
    "Mayo Clinic Laboratories STSH — adults >=20 years 0.3-4.2 mIU/L",
    "Mayo Clinic Laboratories, test STSH (Thyroid-Stimulating Hormone-Sensitive, Serum). Adults >=20 years: 0.3-4.2 mIU/L (numerically identical to uU/mL). The unpublished wellness interior of 0.4-2.5 is not on this page and is not used. Pregnancy-specific targets are not collected here, so this adult ambulatory interval is applied as-is. Mayo's thyroid cascade (THSCM) uses the same 0.3 / 4.2 reflex cutpoints.",
    "https://www.mayocliniclabs.com/test-catalog/overview/8939",
  ),
  demographic: { ageMin: 20 },
});

newRows.push({
  biomarkerId: "cortisol",
  name: "Cortisol",
  subtitle: "Adrenal hormone (morning interval)",
  sectionId: "hormones",
  unit: "ug/dL",
  loincCode: "2143-6",
  sourced: true,
  labLow: 7,
  labHigh: 25,
  bands: riBands(7, 25),
  sourceRefs: [
    {
      label:
        "Mayo Clinic Laboratories CORT — adults >=18 years a.m. 7-25 mcg/dL (p.m. 2-14 not graded)",
      citation:
        "Mayo Clinic Laboratories, test CORT (Cortisol, Serum). Adults >=18 years: a.m. 7-25 mcg/dL; p.m. 2-14 mcg/dL. This product does not collect draw time, so the a.m. interval is the grade (typical fasting/morning panels). A true afternoon draw in the p.m. interval can sit below 7 and be flagged attention even though Mayo would call it in-range for p.m. mcg/dL is numerically identical to ug/dL.",
      url: "https://www.mayocliniclabs.com/test-catalog/overview/8545",
      verifiedAt: VERIFIED,
    },
    BAND_POLICY,
  ],
  demographic: { ageMin: 18 },
});

newRows.push({
  biomarkerId: "folate",
  name: "Folate",
  subtitle: "Vitamin B9",
  sectionId: "vitamins",
  unit: "ng/mL",
  loincCode: "2284-8",
  sourced: true,
  labLow: 4,
  labHigh: null,
  bands: oneSidedLow(4),
  sourceRefs: [
    {
      label:
        "Mayo Clinic Laboratories FOL — >=4.0 mcg/L; <4.0 mcg/L suggests folate deficiency",
      citation:
        "Mayo Clinic Laboratories, test FOL (Folate, Serum). Reference values: >=4.0 mcg/L. <4.0 mcg/L suggests folate deficiency. mcg/L is numerically identical to ng/mL. No upper reference limit or interior optimum is published, so bands are attention below 4 / good at or above 4. Mayo notes the cutoff is consensus derived from US NHANES III.",
      url: "https://www.mayocliniclabs.com/test-catalog/overview/9198",
      verifiedAt: VERIFIED,
    },
    {
      label:
        "WHO 2008 technical consultation — serum folate <4 mcg/L used as a deficiency cutoff (citation only; Mayo supplies the product bands)",
      citation:
        "de Benoist B. Conclusions of a WHO Technical Consultation on folate and vitamin B12 deficiencies. Food Nutr Bull. 2008;29(2 Suppl):S238-S244. Cited by Mayo FOL as the source of the <4 mcg/L consensus cutoff. Does not add an upper bound or an optimum above 4.",
      url: "https://doi.org/10.1177/15648265080292S129",
      verifiedAt: VERIFIED,
    },
  ],
});

newRows.push({
  biomarkerId: "crp",
  name: "CRP",
  subtitle: "C-reactive protein (hs-CRP risk tertiles)",
  sectionId: "inflammation",
  unit: "mg/L",
  loincCode: "30522-7",
  sourced: true,
  labLow: null,
  labHigh: 3,
  bands: [
    { status: "optimal", min: null, max: 1 },
    { status: "good", min: 1.001, max: 3 },
    { status: "attention", min: 3.001, max: null },
  ],
  sourceRefs: [
    {
      label:
        "AHA/CDC 2003 — hs-CRP relative-risk tertiles <1.0 / 1.0-3.0 / >3.0 mg/L",
      citation:
        "Pearson TA, Mensah GA, Alexander RW, et al. Markers of Inflammation and Cardiovascular Disease: Application to Clinical and Public Health Practice. AHA/CDC Scientific Statement. Circulation. 2003;107:499-511. Relative-risk categories (low, average, high) correspond to approximate tertiles of hs-CRP (<1.0, 1.0 to 3.0, and >3.0 mg/L). Mapped here as optimal <=1 / good 1-3 / attention >3. The statement is for high-sensitivity CRP, not conventional CRP assays whose upper limits are often ~5-10 mg/L. Values >10 mg/L should be repeated because they often reflect acute inflammation rather than chronic vascular risk. Lab in-range is <=3 mg/L (high-risk tertile begins above 3).",
      url: "https://www.ahajournals.org/doi/10.1161/01.CIR.0000052939.59093.45",
      verifiedAt: VERIFIED,
    },
  ],
});

newRows.push({
  biomarkerId: "lp-a",
  name: "Lipoprotein(a)",
  subtitle: "Genetically influenced lipoprotein particle",
  sectionId: "lipid",
  unit: "mg/dL",
  loincCode: "10835-7",
  sourced: true,
  labLow: null,
  labHigh: 50,
  bands: [
    { status: "good", min: null, max: 49.999 },
    { status: "attention", min: 50, max: null },
  ],
  sourceRefs: [
    {
      label:
        "2018 AHA/ACC cholesterol guideline — Lp(a) >=50 mg/dL (>=125 nmol/L) is a risk-enhancing factor",
      citation:
        "Grundy SM et al. 2018 AHA/ACC/Multisociety Guideline on the Management of Blood Cholesterol. Circulation. 2019. Lipoprotein(a) >=50 mg/dL or >=125 nmol/L constitutes a risk-enhancing factor. That is the only named cutpoint used here. The common lab flag of <30 mg/dL is not in this guideline and is not used as an optimum. Assays report mg/dL or nmol/L; this row grades mg/dL only. nmol/L results need conversion before grading.",
      url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000625",
      verifiedAt: VERIFIED,
    },
  ],
});

data.markers = data.markers.filter((m) => !REPLACE.has(m.biomarkerId));
data.markers.push(...newRows);
data.version = "1.3.3";
data.notes =
  "Educational seed. NOT clinician-reviewed. Prefer printed lab intervals when available. Do not treat as diagnosis. v1.3.3: sourced TSH (Mayo STSH 0.3-4.2), morning cortisol (Mayo CORT a.m. 7-25), folate (Mayo FOL >=4), hs-CRP (AHA/CDC 2003 tertiles), and Lp(a) (ACC/AHA 2018 >=50). v1.3.2: Mayo APOAB ApoB:ApoA1. Remaining calculated ratios, UIBC, VLDL, eAG, female cycle-phase hormones, and analyzer-specific CBC indices stay unsourced or in the review backlog. See data/SOURCES.md.";

writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
console.log(
  `Wrote ${newRows.length} replacement rows; markers now ${data.markers.length}`,
);
