import { listReferenceRanges } from "@/data/reference-ranges";
import { scoreBiomarker } from "@/lib/scoring";
import type { Biomarker, Demographic } from "@/lib/types";

const DEMO_DEMOGRAPHIC: Demographic = { sex: "male", ageYears: 27 };

/** Mock lab values for /preview/biomarker-cards — not real user data */
const DEMO_VALUES: Record<
  string,
  { value: number | null; valueDisplay?: string }
> = {
  "total-cholesterol": { value: 134 },
  "ldl-cholesterol": { value: 67.6 },
  "hdl-cholesterol": { value: 56 },
  "glucose-fasting": { value: 92 },
  alt: { value: 28 },
  hemoglobin: { value: 15.2 },
  "unsourced-example": { value: 5 },
};

/**
 * Build typed Biomarker cards from the sourced data layer + scoring.
 * No ranges invented in the UI layer.
 */
export function getDemoBiomarkers(
  demographic: Demographic = DEMO_DEMOGRAPHIC,
): Biomarker[] {
  const ids = [
    "total-cholesterol",
    "ldl-cholesterol",
    "hdl-cholesterol",
    "glucose-fasting",
    "alt",
    "hemoglobin",
    "unsourced-example",
  ];

  return ids.map((biomarkerId) => {
    const demo = DEMO_VALUES[biomarkerId] ?? { value: null };
    const scored = scoreBiomarker({
      biomarkerId,
      value: demo.value,
      demographic,
    });
    const meta =
      scored.range ??
      listReferenceRanges().find((m) => m.biomarkerId === biomarkerId);

    const needsAction =
      scored.status === "fair" || scored.status === "attention";

    return {
      id: biomarkerId,
      name: meta?.name ?? biomarkerId,
      subtitle: meta?.subtitle,
      unit: meta?.unit ?? "",
      value: scored.value,
      valueDisplay: demo.valueDisplay,
      range: scored.range,
      status: scored.status,
      labStatus: scored.labStatus,
      sourceRefs: scored.sourceRefs,
      sectionId: meta?.sectionId ?? "other",
      recommendedAction: needsAction
        ? "Commonly influenced by lifestyle factors — consider discussing with your doctor"
        : undefined,
    } satisfies Biomarker;
  });
}
