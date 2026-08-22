/**
 * Educational follow-up markers commonly discussed alongside out-of-range
 * results. Never invents values — only highlights gray "not tested" slots
 * that may be worth asking a clinician about.
 */

export type RelatedTestSuggestion = {
  biomarkerId: string;
  /** Short, non-diagnostic reason naming the triggering marker */
  reason: string;
};

/**
 * When a measured marker is fair/attention (or lab out-of-range), suggest
 * these untested panel slots. Keys are measured biomarker ids.
 */
const RELATED_BY_TRIGGER: Record<string, string[]> = {
  hemoglobin: ["ferritin", "serum-iron", "vitamin-b12", "folate", "tibc"],
  hematocrit: ["ferritin", "serum-iron", "vitamin-b12", "folate"],
  rbc: ["ferritin", "serum-iron", "vitamin-b12", "folate"],
  ferritin: ["serum-iron", "tibc", "transferrin", "vitamin-b12", "folate"],
  "serum-iron": ["ferritin", "tibc", "transferrin", "iron-saturation"],
  transferrin: ["ferritin", "serum-iron", "tibc", "iron-saturation"],
  tibc: ["ferritin", "serum-iron", "transferrin", "iron-saturation"],
  "iron-saturation": ["ferritin", "serum-iron", "tibc"],
  "ldl-cholesterol": ["apo-b", "apo-a1", "lp-a", "triglycerides", "hdl-cholesterol"],
  "total-cholesterol": [
    "ldl-cholesterol",
    "hdl-cholesterol",
    "triglycerides",
    "apo-b",
  ],
  "hdl-cholesterol": ["triglycerides", "apo-b"],
  triglycerides: ["ldl-cholesterol", "hdl-cholesterol", "apo-b", "glucose-fasting"],
  "glucose-fasting": ["hba1c", "insulin", "c-peptide"],
  hba1c: ["glucose-fasting", "insulin", "c-peptide"],
  insulin: ["glucose-fasting", "hba1c", "c-peptide"],
  tsh: ["free-t4", "free-t3", "tpoab"],
  "free-t4": ["tsh", "free-t3"],
  "free-t3": ["tsh", "free-t4"],
  creatinine: ["egfr", "urea"],
  urea: ["creatinine", "egfr"],
  egfr: ["creatinine", "urea"],
  alt: ["ast", "ggt", "bilirubin-total"],
  ast: ["alt", "ggt", "bilirubin-total"],
  ggt: ["alt", "ast"],
  "bilirubin-total": ["alt", "ast", "albumin", "bilirubin-direct"],
  cortisol: ["dhea-s", "tsh"],
  testosterone: ["free-testosterone", "shbg", "estradiol"],
  "free-testosterone": ["testosterone", "shbg"],
  "vitamin-b12": ["folate", "homocysteine"],
  folate: ["vitamin-b12", "homocysteine"],
  crp: ["esr"],
  esr: ["crp"],
};

/** Clean self-filter: never suggest the same id, drop empty stubs. */
function targetsFor(triggerId: string): string[] {
  return (RELATED_BY_TRIGGER[triggerId] ?? []).filter(
    (id) => id && id !== triggerId,
  );
}

export function suggestedTestsForResults(
  measured: Array<{
    id: string;
    name: string;
    status: string | null;
    labStatus: string;
  }>,
): Map<string, RelatedTestSuggestion> {
  const out = new Map<string, RelatedTestSuggestion>();

  for (const m of measured) {
    const flagged =
      m.status === "attention" ||
      m.status === "fair" ||
      m.labStatus === "out_of_range";
    if (!flagged) continue;

    for (const targetId of targetsFor(m.id)) {
      const existing = out.get(targetId);
      // Prefer attention-driven reasons over fair when both apply.
      if (existing && m.status !== "attention") continue;
      out.set(targetId, {
        biomarkerId: targetId,
        reason: `Often discussed alongside your ${m.name} result — ask your clinician whether it’s useful next time.`,
      });
    }
  }

  return out;
}
