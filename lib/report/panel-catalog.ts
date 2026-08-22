/**
 * Expected wellness-panel markers shown on reports even when absent from an
 * upload. Inspired by common at-home panels (SiPhox-style coverage) — used only
 * as gray "not tested" slots, never as invented values.
 */
export const PANEL_CATALOG: Array<{
  biomarkerId: string;
  sectionId: string;
}> = [
  // Heart
  { biomarkerId: "total-cholesterol", sectionId: "lipid" },
  { biomarkerId: "ldl-cholesterol", sectionId: "lipid" },
  { biomarkerId: "hdl-cholesterol", sectionId: "lipid" },
  { biomarkerId: "triglycerides", sectionId: "lipid" },
  { biomarkerId: "apo-b", sectionId: "lipid" },
  { biomarkerId: "apo-a1", sectionId: "lipid" },
  { biomarkerId: "lp-a", sectionId: "lipid" },
  // Metabolic
  { biomarkerId: "glucose-fasting", sectionId: "metabolic" },
  { biomarkerId: "hba1c", sectionId: "metabolic" },
  { biomarkerId: "insulin", sectionId: "metabolic" },
  { biomarkerId: "c-peptide", sectionId: "metabolic" },
  { biomarkerId: "uric-acid", sectionId: "metabolic" },
  { biomarkerId: "homocysteine", sectionId: "metabolic" },
  // Hormones
  { biomarkerId: "cortisol", sectionId: "hormones" },
  { biomarkerId: "testosterone", sectionId: "hormones" },
  { biomarkerId: "free-testosterone", sectionId: "hormones" },
  { biomarkerId: "shbg", sectionId: "hormones" },
  { biomarkerId: "estradiol", sectionId: "hormones" },
  { biomarkerId: "dhea-s", sectionId: "hormones" },
  { biomarkerId: "fsh", sectionId: "hormones" },
  { biomarkerId: "lh", sectionId: "hormones" },
  { biomarkerId: "prolactin", sectionId: "hormones" },
  // Kidney
  { biomarkerId: "creatinine", sectionId: "kidney" },
  { biomarkerId: "urea", sectionId: "kidney" },
  { biomarkerId: "egfr", sectionId: "kidney" },
  // Liver
  { biomarkerId: "alt", sectionId: "liver" },
  { biomarkerId: "ast", sectionId: "liver" },
  { biomarkerId: "ggt", sectionId: "liver" },
  { biomarkerId: "alp", sectionId: "liver" },
  { biomarkerId: "bilirubin-total", sectionId: "liver" },
  { biomarkerId: "bilirubin-direct", sectionId: "liver" },
  { biomarkerId: "albumin", sectionId: "liver" },
  { biomarkerId: "total-protein", sectionId: "liver" },
  // Thyroid
  { biomarkerId: "tsh", sectionId: "thyroid" },
  { biomarkerId: "free-t4", sectionId: "thyroid" },
  { biomarkerId: "free-t3", sectionId: "thyroid" },
  { biomarkerId: "tpoab", sectionId: "thyroid" },
  { biomarkerId: "tgab", sectionId: "thyroid" },
  // Prostate
  { biomarkerId: "psa", sectionId: "prostate" },
  // Nutritional / iron
  { biomarkerId: "vitamin-d", sectionId: "vitamins" },
  { biomarkerId: "vitamin-b12", sectionId: "vitamins" },
  { biomarkerId: "folate", sectionId: "vitamins" },
  { biomarkerId: "ferritin", sectionId: "vitamins" },
  { biomarkerId: "serum-iron", sectionId: "vitamins" },
  { biomarkerId: "iron-saturation", sectionId: "vitamins" },
  { biomarkerId: "transferrin", sectionId: "vitamins" },
  { biomarkerId: "tibc", sectionId: "vitamins" },
  { biomarkerId: "uibc", sectionId: "vitamins" },
  { biomarkerId: "omega-3-index", sectionId: "vitamins" },
  // CBC / inflammation
  { biomarkerId: "hemoglobin", sectionId: "cbc" },
  { biomarkerId: "hematocrit", sectionId: "cbc" },
  { biomarkerId: "wbc", sectionId: "cbc" },
  { biomarkerId: "platelets", sectionId: "cbc" },
  { biomarkerId: "crp", sectionId: "inflammation" },
  { biomarkerId: "esr", sectionId: "inflammation" },
];

export const PANEL_CATALOG_IDS = new Set(
  PANEL_CATALOG.map((m) => m.biomarkerId),
);
