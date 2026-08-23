import { listReferenceRanges } from "@/data/reference-ranges";
import type { ExtractedMarker } from "@/lib/extraction";
import { getBiomarkerExplanation } from "@/lib/report/explanations";
import { PANEL_CATALOG } from "@/lib/report/panel-catalog";
import { suggestedTestsForResults } from "@/lib/report/related-tests";
import { compareToPopulation, scoreBiomarker } from "@/lib/scoring";
import type { PopulationComparison } from "@/lib/scoring";
import type { Biomarker, BiomarkerStatus, Demographic } from "@/lib/types";

/** Mayo PSAFT is not applicable to female reports — do not show a male cutoff. */
function includeOnReport(biomarkerId: string, demographic: Demographic): boolean {
  if (biomarkerId === "psa") return demographic.sex === "male";
  return true;
}

/** Per-marker contribution to section rings (must mirror status hierarchy). */
const STATUS_SCORE: Record<BiomarkerStatus, number> = {
  optimal: 100,
  good: 75,
  fair: 40,
  attention: 0,
};

export type ReportSection = {
  id: string;
  title: string;
  biomarkers: Array<{
    biomarker: Biomarker;
    population: PopulationComparison;
  }>;
};

export const SECTION_TITLES: Record<string, string> = {
  lipid: "Heart Health",
  metabolic: "Metabolic Health",
  hormones: "Hormonal Health",
  kidney: "Kidney Health",
  liver: "Liver Health",
  thyroid: "Thyroid Health",
  prostate: "Prostate Health",
  vitamins: "Nutritional",
  cbc: "Blood Count",
  inflammation: "Inflammation",
  other: "Other markers",
};

export const SECTION_ORDER = [
  "lipid",
  "metabolic",
  "hormones",
  "kidney",
  "liver",
  "thyroid",
  "prostate",
  "vitamins",
  "cbc",
  "inflammation",
  "other",
];

export function buildReportSections(input: {
  markers: ExtractedMarker[];
  demographic: Demographic;
}): ReportSection[] {
  const bySection = new Map<string, ReportSection["biomarkers"]>();
  const seenIds = new Set<string>();
  const rangesById = indexReferenceRangesById();

  for (const marker of input.markers) {
    const biomarkerId = marker.biomarkerId;
    if (!biomarkerId) continue;
    if (!includeOnReport(biomarkerId, input.demographic)) continue;
    seenIds.add(biomarkerId);

    const entry = buildMeasuredEntry(marker, input.demographic, rangesById);
    const list = bySection.get(entry.biomarker.sectionId) ?? [];
    list.push(entry);
    bySection.set(entry.biomarker.sectionId, list);
  }

  const suggestions = suggestedTestsForResults(
    [...bySection.values()].flat().map(({ biomarker }) => ({
      id: biomarker.id,
      name: biomarker.name,
      status: biomarker.status,
      labStatus: biomarker.labStatus,
    })),
  );

  // Fill expected panel markers that were not in the upload (gray "not tested").
  for (const slot of PANEL_CATALOG) {
    if (seenIds.has(slot.biomarkerId)) continue;
    if (!includeOnReport(slot.biomarkerId, input.demographic)) continue;
    const meta = rangesById.get(slot.biomarkerId);
    if (!meta) continue;

    const explanation = getBiomarkerExplanation(slot.biomarkerId);
    const suggestion = suggestions.get(slot.biomarkerId);
    const biomarker: Biomarker = {
      id: slot.biomarkerId,
      name: meta.name ?? slot.biomarkerId,
      subtitle: meta.subtitle,
      unit: meta.unit || "",
      value: null,
      range: meta.sourced ? meta : null,
      status: null,
      labStatus: "unknown",
      sourceRefs: meta.sourceRefs ?? [],
      sectionId: meta.sectionId ?? slot.sectionId,
      explanation: explanation?.summary,
      notTested: true,
      suggestedTest: Boolean(suggestion),
      suggestedTestReason: suggestion?.reason,
    };

    const population = compareToPopulation({
      biomarkerId: slot.biomarkerId,
      value: null,
      demographic: input.demographic,
    });

    const sectionId = biomarker.sectionId;
    const list = bySection.get(sectionId) ?? [];
    list.push({ biomarker, population });
    bySection.set(sectionId, list);
  }

  return [...bySection.entries()]
    .sort(([a], [b]) => {
      const ai = SECTION_ORDER.indexOf(a);
      const bi = SECTION_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    })
    .map(([id, biomarkers]) => ({
      id,
      title: SECTION_TITLES[id] ?? SECTION_TITLES.other,
      biomarkers: biomarkers.sort((a, b) => {
        // Measured markers first; suggested untested before other gray slots.
        const an = a.biomarker.notTested ? 1 : 0;
        const bn = b.biomarker.notTested ? 1 : 0;
        if (an !== bn) return an - bn;
        const as = a.biomarker.suggestedTest ? 0 : 1;
        const bs = b.biomarker.suggestedTest ? 0 : 1;
        if (as !== bs) return as - bs;
        return a.biomarker.name.localeCompare(b.biomarker.name);
      }),
    }));
}

function indexReferenceRangesById() {
  const map = new Map<string, ReturnType<typeof listReferenceRanges>[number]>();
  for (const range of listReferenceRanges()) {
    if (!map.has(range.biomarkerId)) map.set(range.biomarkerId, range);
  }
  return map;
}

function buildMeasuredEntry(
  marker: ExtractedMarker,
  demographic: Demographic,
  rangesById: Map<string, ReturnType<typeof listReferenceRanges>[number]>,
): ReportSection["biomarkers"][number] {
  const biomarkerId = marker.biomarkerId as string;
  const scored = scoreBiomarker({
    biomarkerId,
    value: marker.value,
    demographic,
  });
  const meta = scored.range ?? rangesById.get(biomarkerId);

  const needsAction =
    scored.status === "fair" || scored.status === "attention";
  const explanation = getBiomarkerExplanation(biomarkerId);

  const biomarker: Biomarker = {
    id: biomarkerId,
    name: meta?.name ?? marker.name,
    subtitle: meta?.subtitle,
    unit: marker.unit || meta?.unit || "",
    value: scored.value,
    valueDisplay: marker.valueDisplay,
    range: scored.range,
    status: scored.status,
    labStatus: scored.labStatus,
    sourceRefs: scored.sourceRefs,
    sectionId: meta?.sectionId ?? "other",
    explanation: explanation?.summary,
    recommendedAction: needsAction
      ? explanation?.discussWithClinician ??
        "Commonly influenced by lifestyle factors — consider discussing with your doctor"
      : undefined,
  };

  const population = compareToPopulation({
    biomarkerId,
    value: biomarker.value,
    demographic,
    valueUnit: biomarker.unit || meta?.unit,
  });

  return { biomarker, population };
}

/**
 * Weighted optimization score from graded markers in the section.
 * Uses status weights (optimal 100 → attention 0), not a binary in-range %.
 */
export function sectionOptimizationPercent(
  section: ReportSection,
): number | null {
  const graded = section.biomarkers.filter(
    (b) => b.biomarker.range?.sourced && b.biomarker.status != null,
  );
  if (graded.length === 0) return null;
  const sum = graded.reduce((acc, b) => {
    const status = b.biomarker.status as BiomarkerStatus;
    return acc + STATUS_SCORE[status];
  }, 0);
  return Math.round(sum / graded.length);
}

/** @deprecated Use sectionOptimizationPercent — kept as alias for call sites. */
export function sectionInRangePercent(section: ReportSection): number | null {
  return sectionOptimizationPercent(section);
}

export type SectionPopulationSummary = {
  available: boolean;
  /** Your optimization % on the comparable marker set */
  userPercent: number | null;
  /** Optimization % if those markers sat at the demographic mean/median */
  populationPercent: number | null;
  /**
   * Score-point gap: userPercent − populationPercent.
   * Positive = better optimization score than a typical demographic panel.
   */
  scoreDelta: number | null;
  direction: "above" | "below" | "equal" | null;
  sampleSize: number;
  /** Distinct sourced datasets contributing to the typical panel */
  datasets: string[];
};

/**
 * Section-level demographic comparison: your optimization score vs the score
 * a typical person in your demographic would get if every comparable marker
 * sat at the sourced population mean/median (same bands + weights).
 *
 * This is NOT the mean of raw value % gaps — those stay on the per-marker
 * detail panel. Unavailable when no graded marker has a scorable benchmark.
 */
export function sectionPopulationSummary(
  section: ReportSection,
  demographic: Demographic,
): SectionPopulationSummary {
  const empty: SectionPopulationSummary = {
    available: false,
    userPercent: null,
    populationPercent: null,
    scoreDelta: null,
    direction: null,
    sampleSize: 0,
    datasets: [],
  };

  let userSum = 0;
  let popSum = 0;
  let count = 0;
  const datasets = new Set<string>();

  for (const entry of section.biomarkers) {
    const { biomarker, population } = entry;
    if (biomarker.notTested) continue;
    if (!biomarker.range?.sourced || biomarker.status == null) continue;
    if (
      !population.available ||
      population.benchmarkValue == null ||
      !Number.isFinite(population.benchmarkValue)
    ) {
      continue;
    }

    const typical = scoreBiomarker({
      biomarkerId: biomarker.id,
      value: population.benchmarkValue,
      demographic,
    });
    if (typical.status == null) continue;

    userSum += STATUS_SCORE[biomarker.status];
    popSum += STATUS_SCORE[typical.status];
    count += 1;
    if (population.dataset) datasets.add(population.dataset);
  }

  if (count === 0) return empty;

  const userPercent = Math.round(userSum / count);
  const populationPercent = Math.round(popSum / count);
  const scoreDelta = userPercent - populationPercent;
  const direction =
    Math.abs(scoreDelta) < 1
      ? "equal"
      : scoreDelta > 0
        ? "above"
        : "below";

  return {
    available: true,
    userPercent,
    populationPercent,
    scoreDelta,
    direction,
    sampleSize: count,
    datasets: [...datasets],
  };
}
