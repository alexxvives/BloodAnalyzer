import type { ExtractedMarker } from "@/lib/extraction/types";
import type { ActionPlanMarkerInput } from "@/lib/report/action-plan";
import {
  buildReportSections,
  sectionOptimizationPercent,
  sectionPopulationSummary,
  type ReportSection,
  type SectionPopulationSummary,
} from "@/lib/report/build-report";
import {
  estimateBiologicalAge,
  type BiologicalAgeEstimate,
} from "@/lib/scoring/biological-age";
import type { Demographic } from "@/lib/types";

/** Health sections shown in the top summary list (excludes CBC / other). */
export const SUMMARY_SECTION_IDS = [
  "lipid",
  "metabolic",
  "hormones",
  "kidney",
  "liver",
  "thyroid",
  "prostate",
  "vitamins",
] as const;

export type ReportOverview = {
  total: number;
  graded: number;
  pct: number | null;
};

/** Serializable, server-built payload for the report UI. */
export type ReportViewModel = {
  demographic: Demographic;
  sections: ReportSection[];
  summarySections: ReportSection[];
  overview: ReportOverview;
  bioAge: BiologicalAgeEstimate;
  actionMarkers: ActionPlanMarkerInput[];
  overallPopulation: SectionPopulationSummary;
};

/**
 * Build the full report view model on the server (or in tests).
 * Keeps reference/population JSON and scoring off the client critical path.
 */
export function buildReportViewModel(input: {
  markers: ExtractedMarker[];
  demographic: Demographic;
}): ReportViewModel {
  const sections = buildReportSections(input);
  const overview = summarizeReport(sections);
  const bioAge = estimateBiologicalAge({
    chronologicalAgeYears: input.demographic.ageYears,
    optimizationPercent: overview.pct,
    gradedMarkerCount: overview.graded,
  });
  const summarySections = SUMMARY_SECTION_IDS.map((id) =>
    sections.find((s) => s.id === id),
  ).filter((s): s is ReportSection => Boolean(s));

  return {
    demographic: input.demographic,
    sections,
    summarySections,
    overview,
    bioAge,
    actionMarkers: toActionPlanMarkers(sections),
    overallPopulation: sectionPopulationSummary(
      {
        id: "all",
        title: "All",
        biomarkers: sections.flatMap((s) => s.biomarkers),
      },
      input.demographic,
    ),
  };
}

function summarizeReport(sections: ReportSection[]): ReportOverview {
  const all = sections.flatMap((s) => s.biomarkers);
  const measured = all.filter((b) => !b.biomarker.notTested);
  const graded = measured.filter(
    (b) => b.biomarker.range?.sourced && b.biomarker.status != null,
  );
  return {
    total: measured.length,
    graded: graded.length,
    pct: sectionOptimizationPercent({
      id: "all",
      title: "All",
      biomarkers: graded,
    }),
  };
}

function toActionPlanMarkers(
  sections: ReportSection[],
): ActionPlanMarkerInput[] {
  return sections.flatMap((section) =>
    section.biomarkers
      .filter(({ biomarker }) => !biomarker.notTested)
      .map(({ biomarker }) => ({
        id: biomarker.id,
        name: biomarker.name,
        section: section.title,
        value: biomarker.value,
        valueDisplay: biomarker.valueDisplay,
        unit: biomarker.unit,
        status: biomarker.status,
        labStatus: biomarker.labStatus,
      })),
  );
}
