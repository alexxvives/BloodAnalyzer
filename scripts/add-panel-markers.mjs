/**
 * Appends SiPhox-style panel markers that are missing from markers.json.
 * New rows are sourced:false — UI shows "range not available" / not-tested gray.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const path = join(__dirname, "..", "data", "reference-ranges", "v1", "markers.json");
const data = JSON.parse(readFileSync(path, "utf8"));
const existing = new Set(data.markers.map((m) => m.biomarkerId));

/** @type {Array<Record<string, unknown>>} */
const additions = [
  {
    biomarkerId: "apo-b",
    name: "ApoB",
    subtitle: "Apolipoprotein B — atherogenic particle count",
    sectionId: "lipid",
    unit: "mg/dL",
    loincCode: "1884-6",
  },
  {
    biomarkerId: "hba1c",
    name: "HbA1c",
    subtitle: "Average blood sugar over ~3 months",
    sectionId: "metabolic",
    unit: "%",
    loincCode: "4548-4",
  },
  {
    biomarkerId: "insulin",
    name: "Insulin",
    subtitle: "Fasting insulin",
    sectionId: "metabolic",
    unit: "uIU/mL",
    loincCode: "20448-7",
  },
  {
    biomarkerId: "egfr",
    name: "eGFR",
    subtitle: "Estimated glomerular filtration rate",
    sectionId: "kidney",
    unit: "mL/min/1.73m²",
    loincCode: "98979-8",
  },
  {
    biomarkerId: "alp",
    name: "Alkaline Phosphatase",
    subtitle: "Liver and bone enzyme",
    sectionId: "liver",
    unit: "U/L",
    loincCode: "6768-6",
  },
  {
    biomarkerId: "bilirubin-total",
    name: "Total Bilirubin",
    subtitle: "Liver pigment from heme breakdown",
    sectionId: "liver",
    unit: "mg/dL",
    loincCode: "1975-2",
  },
  {
    biomarkerId: "albumin",
    name: "Albumin",
    subtitle: "Major blood protein",
    sectionId: "liver",
    unit: "g/dL",
    loincCode: "1751-7",
  },
  {
    biomarkerId: "free-t3",
    name: "Free T3",
    subtitle: "Unbound triiodothyronine",
    sectionId: "thyroid",
    unit: "pg/mL",
    loincCode: "3051-0",
  },
  {
    biomarkerId: "free-t4",
    name: "Free T4",
    subtitle: "Unbound thyroxine",
    sectionId: "thyroid",
    unit: "ng/dL",
    loincCode: "3024-7",
  },
  {
    biomarkerId: "testosterone",
    name: "Testosterone",
    subtitle: "Total testosterone",
    sectionId: "hormones",
    unit: "ng/dL",
    loincCode: "2986-8",
  },
  {
    biomarkerId: "free-testosterone",
    name: "Free Testosterone",
    subtitle: "Unbound testosterone",
    sectionId: "hormones",
    unit: "pg/mL",
  },
  {
    biomarkerId: "shbg",
    name: "SHBG",
    subtitle: "Sex hormone-binding globulin",
    sectionId: "hormones",
    unit: "nmol/L",
    loincCode: "13967-5",
  },
  {
    biomarkerId: "estradiol",
    name: "Estradiol",
    subtitle: "Primary estrogen",
    sectionId: "hormones",
    unit: "pg/mL",
    loincCode: "2243-4",
  },
  {
    biomarkerId: "dhea-s",
    name: "DHEA-S",
    subtitle: "Dehydroepiandrosterone sulfate",
    sectionId: "hormones",
    unit: "ug/dL",
    loincCode: "2191-5",
  },
  {
    biomarkerId: "fsh",
    name: "FSH",
    subtitle: "Follicle-stimulating hormone",
    sectionId: "hormones",
    unit: "mIU/mL",
    loincCode: "15067-2",
  },
  {
    biomarkerId: "lh",
    name: "LH",
    subtitle: "Luteinizing hormone",
    sectionId: "hormones",
    unit: "mIU/mL",
    loincCode: "10501-5",
  },
  {
    biomarkerId: "prolactin",
    name: "Prolactin",
    subtitle: "Pituitary hormone",
    sectionId: "hormones",
    unit: "ng/mL",
    loincCode: "2842-3",
  },
  {
    biomarkerId: "psa",
    name: "PSA",
    subtitle: "Prostate-specific antigen",
    sectionId: "prostate",
    unit: "ng/mL",
    loincCode: "2857-1",
  },
  {
    biomarkerId: "tibc",
    name: "TIBC",
    subtitle: "Total iron-binding capacity",
    sectionId: "vitamins",
    unit: "ug/dL",
    loincCode: "2500-7",
  },
  {
    biomarkerId: "omega-3-index",
    name: "Omega-3 Index",
    subtitle: "EPA + DHA in red blood cells",
    sectionId: "vitamins",
    unit: "%",
  },
];

let added = 0;
for (const m of additions) {
  if (existing.has(m.biomarkerId)) continue;
  data.markers.push({
    ...m,
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
  });
  added += 1;
}

const versionParts = String(data.version || "1.0.0").split(".").map(Number);
versionParts[1] = (versionParts[1] || 0) + 1;
versionParts[2] = 0;
data.version = versionParts.join(".");
data.notes = `${data.notes || ""} Added SiPhox-style panel placeholders (sourced:false) for markers commonly offered on fuller analytics but missing from many lab PDFs.`.trim();

writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Added ${added} markers → ${path} (v${data.version})`);
