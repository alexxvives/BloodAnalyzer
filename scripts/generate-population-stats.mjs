/**
 * Builds data/population-stats/v1/stats.json from cited NHANES-derived medians
 * (LabNorms redistribution of CDC NHANES public microdata) plus previously
 * loaded Gao/Le means for lipids and hemoglobin.
 *
 * Run: node scripts/generate-population-stats.mjs
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const AGE_BANDS = [
  [20, 29],
  [30, 39],
  [40, 49],
  [50, 59],
  [60, 69],
  [70, 79],
];

/** @type {Record<string, { unit: string; dataset: string; url: string; label: string; male: number[]; female: number[] }>} */
const MEDIAN_TABLES = {
  "glucose-fasting": {
    unit: "mg/dL",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/fasting-glucose/",
    label: "NHANES 2017–2020 fasting glucose medians (via LabNorms)",
    male: [99, 101, 104, 107, 112, 113],
    female: [94, 97, 100, 103, 106, 105],
  },
  alt: {
    unit: "U/L",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/alt/",
    label: "NHANES 2017–2020 ALT medians (via LabNorms)",
    male: [21, 23, 24, 25, 20, 18],
    female: [14, 14, 14, 18, 17, 14],
  },
  ast: {
    unit: "U/L",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/ast/",
    label: "NHANES 2017–2020 AST medians (via LabNorms)",
    male: [20, 22, 21, 22, 20, 20],
    female: [17, 16, 17, 19, 19, 19],
  },
  ggt: {
    unit: "U/L",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/ggt/",
    label: "NHANES 2017–2020 GGT medians (via LabNorms)",
    male: [21, 25.4, 26, 26, 24, 22],
    female: [14, 15, 15, 20, 18, 17],
  },
  creatinine: {
    unit: "mg/dL",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/creatinine/",
    label: "NHANES 2017–2020 creatinine medians (via LabNorms)",
    male: [0.9, 0.9, 0.9, 1.0, 1.0, 1.0],
    female: [0.7, 0.7, 0.7, 0.7, 0.8, 0.8],
  },
  "uric-acid": {
    unit: "mg/dL",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/uric-acid/",
    label: "NHANES 2017–2020 uric acid medians (via LabNorms)",
    male: [5.9, 5.9, 5.9, 5.8, 5.9, 5.9],
    female: [4.4, 4.3, 4.4, 4.7, 5.0, 5.2],
  },
  hematocrit: {
    unit: "%",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/hematocrit/",
    label: "NHANES 2017–2020 hematocrit medians (via LabNorms)",
    male: [44.8, 44.5, 44.5, 44.7, 44.0, 42.7],
    female: [39.9, 39.6, 40.0, 40.6, 40.6, 40.1],
  },
  wbc: {
    unit: "10^3/uL",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/wbc/",
    label: "NHANES 2017–2020 WBC medians (via LabNorms)",
    male: [6.7, 6.9, 6.7, 7.0, 7.0, 6.8],
    female: [7.5, 7.3, 7.2, 6.9, 6.6, 7.0],
  },
  platelets: {
    unit: "10^3/uL",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/platelets/",
    label: "NHANES 2017–2020 platelet medians (via LabNorms)",
    male: [233, 235, 233, 218, 220, 202],
    female: [261, 261, 263, 256, 244, 232],
  },
  ferritin: {
    unit: "ng/mL",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/ferritin/",
    label: "NHANES 2017–2020 ferritin medians (via LabNorms)",
    male: [95, 110, 122, 138, 155, 162],
    female: [34, 36, 44, 82, 95, 102],
  },
  "vitamin-d": {
    unit: "ng/mL",
    dataset: "NHANES 2017–2018 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/vitamin-d/",
    label: "NHANES 2017–2018 25(OH)D medians (via LabNorms)",
    male: [23.4, 23.3, 26.7, 29.8, 29.5, 34.7],
    female: [24.0, 25.2, 27.8, 29.7, 36.1, 37.5],
  },
  mcv: {
    unit: "fL",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/mcv/",
    label: "NHANES 2017–2020 MCV medians (via LabNorms)",
    male: [88, 88.1, 89.6, 89.5, 90.5, 91.6],
    female: [88.1, 89.3, 88.8, 89.3, 89.7, 91.1],
  },
  crp: {
    unit: "mg/L",
    dataset: "NHANES 2017–March 2020 hs-CRP (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/crp/",
    label: "NHANES 2017–2020 hs-CRP medians (via LabNorms)",
    male: [1.3, 1.4, 1.7, 1.7, 1.9, 1.6],
    female: [1.9, 2.0, 2.6, 2.4, 2.2, 2.1],
  },
  // Stored as absolute cells/µL to match markers.json (LabNorms publishes ×10⁶/µL).
  rbc: {
    unit: "/uL",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/rbc/",
    label: "NHANES 2017–2020 RBC medians (via LabNorms; ×10⁶/µL → /µL)",
    male: [5.1e6, 5.1e6, 5.0e6, 5.0e6, 4.9e6, 4.7e6],
    female: [4.5e6, 4.5e6, 4.5e6, 4.6e6, 4.5e6, 4.4e6],
  },
  tsh: {
    unit: "uU/mL",
    dataset: "NHANES 2009–2012 thyroid (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/tsh/",
    label: "NHANES 2009–2012 TSH medians (via LabNorms; mIU/L ≡ uU/mL)",
    male: [1.4, 1.3, 1.5, 1.7, 2.0, 1.8],
    female: [1.3, 1.5, 1.6, 1.6, 1.7, 1.9],
  },
  // markers.json stores US BUN mg/dL (Mayo). LabNorms publishes BUN mg/dL.
  urea: {
    unit: "mg/dL",
    dataset: "NHANES 2017–March 2020 BUN medians (US adults, age-/sex-stratified)",
    url: "https://labnorms.com/analytes/bun/",
    label: "NHANES 2017–2020 BUN medians (via LabNorms)",
    male: [13, 13, 15, 15, 16, 18],
    female: [11, 11, 12, 14, 16, 18],
  },
  "vitamin-b12": {
    unit: "pg/mL",
    dataset: "NHANES 2013–2014 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/vitamin-b12/",
    label: "NHANES 2013–2014 vitamin B12 medians (via LabNorms)",
    male: [515, 500, 490, 482, 482, 521],
    female: [493, 477, 487, 544, 582, 589],
  },
  folate: {
    unit: "ng/mL",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/serum-folate/",
    label: "NHANES 2017–2020 serum folate medians (via LabNorms)",
    male: [12.3, 12.4, 13.5, 14.6, 17.1, 20.9],
    female: [13.7, 14.9, 14.4, 16.6, 18.6, 22.6],
  },
  "serum-iron": {
    unit: "ug/dL",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/serum-iron/",
    label: "NHANES 2017–2020 serum iron medians (via LabNorms)",
    male: [89, 90, 93, 90, 90, 87],
    female: [73, 75, 76, 81, 83, 79],
  },
  rdw: {
    unit: "%",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/rdw/",
    label: "NHANES 2017–2020 RDW medians (via LabNorms)",
    male: [13, 13.2, 13.3, 13.5, 13.6, 13.8],
    female: [13.2, 13.3, 13.6, 13.5, 13.6, 13.9],
  },
  mch: {
    unit: "pg",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/mch/",
    label: "NHANES 2017–2020 MCH medians (via LabNorms)",
    male: [30, 30, 30.5, 30.4, 30.8, 30.9],
    female: [29.7, 30, 30, 29.9, 30.2, 30.6],
  },
  mchc: {
    unit: "g/dL",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/mchc/",
    label: "NHANES 2017–2020 MCHC medians (via LabNorms)",
    male: [34, 34, 34, 34, 33.8, 33.7],
    female: [33.7, 33.6, 33.6, 33.6, 33.6, 33.5],
  },
  // Percent-of-WBC medians (LBX*PCT), not absolute counts
  neutrophils: {
    unit: "%",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median % of WBC)",
    url: "https://labnorms.com/analytes/neutrophils/",
    label: "NHANES 2017–2020 neutrophil % medians (via LabNorms)",
    male: [55.4, 57.2, 58, 59.1, 59.7, 61.3],
    female: [58.7, 58.9, 59.4, 56.5, 57.4, 60.8],
  },
  lymphocytes: {
    unit: "%",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median % of WBC)",
    url: "https://labnorms.com/analytes/lymphocytes/",
    label: "NHANES 2017–2020 lymphocyte % medians (via LabNorms)",
    male: [32.6, 31.4, 30.6, 29.6, 27, 25.4],
    female: [30.9, 30.6, 30.2, 32.1, 30.6, 26.7],
  },
  monocytes: {
    unit: "%",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median % of WBC)",
    url: "https://labnorms.com/analytes/monocytes/",
    label: "NHANES 2017–2020 monocyte % medians (via LabNorms)",
    male: [8.5, 8, 8.2, 8.4, 8.9, 9],
    female: [7.2, 7.1, 7.2, 7.4, 7.8, 8.6],
  },
  eosinophils: {
    unit: "%",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median % of WBC)",
    url: "https://labnorms.com/analytes/eosinophils/",
    label: "NHANES 2017–2020 eosinophil % medians (via LabNorms)",
    male: [2.4, 2.1, 2.3, 2.3, 2.8, 2.6],
    female: [1.8, 2, 2.1, 2.1, 2.2, 2.5],
  },
  tibc: {
    unit: "ug/dL",
    dataset: "NHANES 2017–March 2020 (US adults, age-/sex-stratified median)",
    url: "https://labnorms.com/analytes/tibc/",
    label: "NHANES 2017–2020 TIBC medians (via LabNorms)",
    male: [314, 314, 314, 319, 314, 304],
    female: [345, 336, 341, 326, 319, 318],
  },
};

/**
 * Serum transferrin (mg/dL) derived from NHANES TIBC via the published
 * conversion Transferrin (mg/dL) ≈ 0.70 × TIBC (µg/dL). NHANES does not
 * publish transferrin concentration directly.
 * @see https://www.ncbi.nlm.nih.gov/books/NBK559119/
 */
function transferrinFromTibc() {
  const tibc = MEDIAN_TABLES.tibc;
  const factor = 0.7;
  const stats = [];
  for (let i = 0; i < AGE_BANDS.length; i++) {
    const [ageMin, ageMax] = AGE_BANDS[i];
    for (const sex of /** @type {const} */ (["male", "female"])) {
      const tibcMedian = tibc[sex][i];
      const median = Math.round(tibcMedian * factor);
      stats.push({
        biomarkerId: "transferrin",
        demographic: { sex, ageMin, ageMax },
        median,
        unit: "mg/dL",
        dataset:
          "NHANES 2017–March 2020 TIBC → transferrin (×0.70; age-/sex-stratified)",
        sourced: true,
        sourceRefs: [
          {
            label: "NHANES 2017–2020 TIBC medians (via LabNorms), converted",
            citation: `Age band ${ageMin}–${ageMax}, ${sex}: TIBC median ${tibcMedian} µg/dL × 0.70 → transferrin ≈ ${median} mg/dL. Conversion: transferrin (mg/dL) ≈ 0.70 × TIBC (µg/dL) (StatPearls Iron-Binding Capacity).`,
            url: "https://labnorms.com/analytes/tibc/",
            verifiedAt: "2026-08-07",
          },
          {
            label: "StatPearls — Iron-Binding Capacity (conversion)",
            citation:
              "Farhana A, Lappin SL. Biochemistry, Transferrin. StatPearls. Transferrin (mg/dL) ≈ 0.70 × TIBC (µg/dL).",
            url: "https://www.ncbi.nlm.nih.gov/books/NBK559119/",
            verifiedAt: "2026-08-07",
          },
        ],
      });
    }
  }
  return stats;
}

function labnormsEntries() {
  const stats = [];
  for (const [biomarkerId, table] of Object.entries(MEDIAN_TABLES)) {
    for (let i = 0; i < AGE_BANDS.length; i++) {
      const [ageMin, ageMax] = AGE_BANDS[i];
      for (const sex of /** @type {const} */ (["male", "female"])) {
        const median = table[sex][i];
        stats.push({
          biomarkerId,
          demographic: { sex, ageMin, ageMax },
          median,
          unit: table.unit,
          dataset: table.dataset,
          sourced: true,
          sourceRefs: [
            {
              label: table.label,
              citation: `Age band ${ageMin}–${ageMax}, ${sex}: median ${median} ${table.unit}. Computed from CDC NHANES public laboratory microdata (weighted adult sample); values redistributed by LabNorms.`,
              url: table.url,
              verifiedAt: "2026-08-06",
            },
            {
              label: "CDC NHANES laboratory data",
              citation:
                "National Center for Health Statistics. National Health and Nutrition Examination Survey laboratory data files.",
              url: "https://wwwn.cdc.gov/nchs/nhanes/Default.aspx",
              verifiedAt: "2026-08-06",
            },
          ],
        });
      }
    }
  }
  return stats;
}

/** Previously sourced adult means (Gao lipids, Le hemoglobin). */
function legacyMeans() {
  const lipidRef = {
    label: "Gao et al. JAHA 2023 — NHANES lipid trends",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9973640/",
    verifiedAt: "2026-08-06",
  };
  const lipids = [
    ["total-cholesterol", 188.4, "Mean total cholesterol 188.4 mg/dL (95% CI 185.4–191.5) in NHANES 2017–2018."],
    ["ldl-cholesterol", 111.7, "Mean LDL-C 111.7 mg/dL (95% CI 109.0–114.4) in NHANES 2017–2018."],
    ["hdl-cholesterol", 53.4, "Mean HDL-C 53.4 mg/dL (95% CI 52.6–54.3) in NHANES 2017–2018."],
    ["triglycerides", 91.4, "Mean triglyceride 91.4 mg/dL (95% CI 88.4–94.6) in NHANES 2017–2018."],
  ];
  const stats = [];
  for (const [biomarkerId, mean, citation] of lipids) {
    for (const sex of ["male", "female"]) {
      stats.push({
        biomarkerId,
        demographic: { sex, ageMin: 20, ageMax: 79 },
        mean,
        unit: "mg/dL",
        dataset: "NHANES 2017–2018 (US adults, age-/sex-adjusted mean)",
        sourced: true,
        sourceRefs: [{ ...lipidRef, citation: `Gao Y, et al. J Am Heart Assoc. 2023. ${citation}` }],
      });
    }
  }
  stats.push(
    {
      biomarkerId: "hemoglobin",
      demographic: { sex: "male", ageMin: 15, ageMax: 79 },
      mean: 14.9,
      unit: "g/dL",
      dataset: "NHANES 2003–2012 (US, sex-stratified mean)",
      sourced: true,
      sourceRefs: [
        {
          label: "Le — PLOS One 2016 anemia prevalence (NHANES 2003–2012)",
          citation:
            "Le CHH. The Prevalence of Anemia and Moderate-Severe Anemia in the US Population (NHANES 2003-2012). PLoS One. 2016. Male mean hemoglobin 14.9 g/dL (95% CI 14.9–15.0).",
          url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0166635",
          verifiedAt: "2026-08-06",
        },
      ],
    },
    {
      biomarkerId: "hemoglobin",
      demographic: { sex: "female", ageMin: 15, ageMax: 79 },
      mean: 13.4,
      unit: "g/dL",
      dataset: "NHANES 2003–2012 (US, sex-stratified mean)",
      sourced: true,
      sourceRefs: [
        {
          label: "Le — PLOS One 2016 anemia prevalence (NHANES 2003–2012)",
          citation:
            "Le CHH. PLoS One. 2016. Female mean hemoglobin 13.4 g/dL (95% CI 13.4–13.5), excluding pregnancy.",
          url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0166635",
          verifiedAt: "2026-08-06",
        },
      ],
    },
  );
  return stats;
}

/**
 * Morning serum cortisol medians (µg/dL) from the C8 Health Project
 * (WVU School of Medicine summary tables) for adults >18, AM draw.
 */
function cortisolMeans() {
  const ref = {
    label: "WVU C8 Health Project — adult morning cortisol",
    url: "https://health.wvu.edu/media/5129/cortisol-all.pdf",
    verifiedAt: "2026-08-06",
  };
  return [
    {
      biomarkerId: "cortisol",
      demographic: { sex: "male", ageMin: 18, ageMax: 79 },
      median: 14.5,
      unit: "ug/dL",
      dataset:
        "C8 Health Project (adults >18, morning blood draw; sex-stratified)",
      sourced: true,
      sourceRefs: [
        {
          ...ref,
          citation:
            "West Virginia University School of Medicine. Summary Results for Cortisol… C8 Health Project. Adult males AM: median 14.50 µg/dL (mean 15.09; n=12,837).",
        },
      ],
    },
    {
      biomarkerId: "cortisol",
      demographic: { sex: "female", ageMin: 18, ageMax: 79 },
      median: 13.1,
      unit: "ug/dL",
      dataset:
        "C8 Health Project (adults >18, morning blood draw; sex-stratified)",
      sourced: true,
      sourceRefs: [
        {
          ...ref,
          citation:
            "West Virginia University School of Medicine. Summary Results for Cortisol… C8 Health Project. Adult females AM: median 13.10 µg/dL (mean 14.42; n=13,671). Timing-critical — morning slice only.",
        },
      ],
    },
  ];
}

/**
 * ESR medians (mm/h) from Alende et al. Medicine 2019 — population sample
 * of A-Estrada, Spain (n=1472), age- and sex-stratified.
 */
function esrMedians() {
  const ref = {
    label: "Alende et al. Medicine 2019 — ESR population medians",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6716712/",
    verifiedAt: "2026-08-06",
  };
  /** Study bands: 18–35, >35–50, >50–65, >65 */
  const bands = [
    { ageMin: 18, ageMax: 35, male: 4, female: 11 },
    { ageMin: 36, ageMax: 50, male: 5, female: 10 },
    { ageMin: 51, ageMax: 65, male: 7, female: 11 },
    { ageMin: 66, ageMax: 91, male: 10, female: 14 },
  ];
  const stats = [];
  for (const band of bands) {
    for (const sex of /** @type {const} */ (["male", "female"])) {
      const median = band[sex];
      stats.push({
        biomarkerId: "esr",
        demographic: { sex, ageMin: band.ageMin, ageMax: band.ageMax },
        median,
        unit: "mm",
        dataset:
          "A-Estrada (Spain) adult population sample, Alende et al. 2019 (age-/sex-stratified median ESR)",
        sourced: true,
        sourceRefs: [
          {
            ...ref,
            citation: `Alende-Castro V, et al. Medicine (Baltimore). 2019. Table 1: age ${band.ageMin}–${band.ageMax}, ${sex}: median ESR ${median} mm/h (IQR reported in source). Population-based sample n=1472.`,
          },
        ],
      });
    }
  }
  return stats;
}

/** Sex-stratified Lp(a) medians from NHANES III (Brandt et al. 2020). */
function lpAMeans() {
  const ref = {
    label: "Brandt et al. J Clin Lipidol 2020 — NHANES III Lp(a)",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7641964/",
    verifiedAt: "2026-08-06",
  };
  return [
    {
      biomarkerId: "lp-a",
      demographic: { sex: "male", ageMin: 17, ageMax: 79 },
      median: 13,
      unit: "mg/dL",
      dataset: "NHANES III 1991–1994 (US adults, sex-stratified median)",
      sourced: true,
      sourceRefs: [
        {
          ...ref,
          citation:
            "Brandt EJ, et al. J Clin Lipidol. 2020. NHANES III sample-adjusted median Lp(a) 13 mg/dL in men (IQR 3–30); overall adult median 14 mg/dL (IQR 3–32).",
        },
      ],
    },
    {
      biomarkerId: "lp-a",
      demographic: { sex: "female", ageMin: 17, ageMax: 79 },
      median: 14,
      unit: "mg/dL",
      dataset: "NHANES III 1991–1994 (US adults, sex-stratified median)",
      sourced: true,
      sourceRefs: [
        {
          ...ref,
          citation:
            "Brandt EJ, et al. J Clin Lipidol. 2020. NHANES III sample-adjusted median Lp(a) 14 mg/dL in women (IQR 4–33); overall adult median 14 mg/dL (IQR 3–32).",
        },
      ],
    },
  ];
}

const dataset = {
  version: "1.8.1",
  reviewStatus: "provisional",
  notes:
    "Lipid means from Gao et al. JAHA 2023 (NHANES 2017–2018). Hemoglobin means from Le PLOS One 2016 (NHANES 2003–2012). Lp(a) sex-stratified medians from Brandt et al. J Clin Lipidol 2020 (NHANES III 1991–1994). Morning cortisol medians from WVU C8 Health Project adult AM tables. ESR medians from Alende et al. Medicine 2019 (Spanish population sample). Age-/sex-stratified medians for glucose, liver enzymes, creatinine, uric acid, CBC indices (MCV/MCH/MCHC/RDW/RBC), CRP, ferritin, vitamin D, folate, serum iron, vitamin B12, TSH, BUN, TIBC, and WBC differential percentages (neutrophils/lymphocytes/monocytes/eosinophils) from CDC NHANES public microdata as redistributed by LabNorms. Serum transferrin mg/dL derived from NHANES TIBC × 0.70 (StatPearls conversion) — NHANES does not publish transferrin concentration directly. Still absent (no cited matching unit/slice): PDW in fL (published large-sample PDW is typically % CV on Sysmex; analyzer fL scales differ), basophil % (NHANES LBXBAPCT exists but no LabNorms age/sex median table or peer-reviewed age/sex median tables with extractable numbers yet).",
  stats: [
    ...legacyMeans(),
    ...lpAMeans(),
    ...cortisolMeans(),
    ...esrMedians(),
    ...labnormsEntries(),
    ...transferrinFromTibc(),
  ],
};

const out = join(__dirname, "..", "data", "population-stats", "v1", "stats.json");
writeFileSync(out, `${JSON.stringify(dataset, null, 2)}\n`);
console.log(`Wrote ${dataset.stats.length} stats → ${out}`);
