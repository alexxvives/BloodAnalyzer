import { demographicFromReport } from "@/lib/db/types";
import type { ReportWithMarkers } from "@/lib/db/report-repository";
import { SECTION_ORDER } from "@/lib/report/build-report";
import { getBiomarkerExplanation } from "@/lib/report/explanations";
import { PANEL_CATALOG } from "@/lib/report/panel-catalog";
import { compareToPopulation, scoreBiomarker } from "@/lib/scoring";
import type { PopulationComparison } from "@/lib/scoring";
import type {
  Biomarker,
  BiomarkerStatus,
  Demographic,
  LabRangeStatus,
} from "@/lib/types";

const FALLBACK_DEMOGRAPHIC: Demographic = { sex: "male", ageYears: 30 };

const CATALOG_INDEX = new Map(
  PANEL_CATALOG.map((entry, index) => [entry.biomarkerId, index]),
);

export type BiomarkerTrendPoint = {
  reportId: string;
  at: string;
  value: number;
  status: BiomarkerStatus | null;
  labStatus: LabRangeStatus;
  rangeAvailable: boolean;
};

/** Sourced optimization bands for soft chart backgrounds (null = unbounded). */
export type TrendZoneBand = {
  status: BiomarkerStatus;
  min: number | null;
  max: number | null;
};

export type BiomarkerTrendSeries = {
  biomarkerId: string;
  name: string;
  unit: string;
  sectionId: string;
  points: BiomarkerTrendPoint[];
  /** Latest vs previous value when both exist */
  delta: number | null;
  deltaPercent: number | null;
  /** Display-only zone fills; null when range not available */
  zones: TrendZoneBand[] | null;
};

/** Prefer lab collection date; fall back to upload/save time for legacy rows. */
export function reportTimelineAt(report: {
  collectedAt: string | null;
  createdAt: string;
}): string {
  return report.collectedAt ?? report.createdAt;
}

/**
 * Build per-biomarker timelines across a user's reports (oldest → newest).
 * Scores each point with that report's demographic snapshot when available.
 * Ordered like the report: SECTION_ORDER, then PANEL_CATALOG within a section.
 */
export function buildBiomarkerTrends(
  rows: ReportWithMarkers[],
): BiomarkerTrendSeries[] {
  const chronological = [...rows].sort((a, b) =>
    reportTimelineAt(a.report).localeCompare(reportTimelineAt(b.report)),
  );

  const byId = new Map<
    string,
    {
      biomarkerId: string;
      name: string;
      unit: string;
      sectionId: string;
      points: BiomarkerTrendPoint[];
      zones: TrendZoneBand[] | null;
    }
  >();

  for (const { report, markers } of chronological) {
    const demographic =
      demographicFromReport(report) ?? FALLBACK_DEMOGRAPHIC;

    for (const m of markers) {
      if (!m.biomarkerId || typeof m.value !== "number") continue;

      const scored = scoreBiomarker({
        biomarkerId: m.biomarkerId,
        value: m.value,
        demographic,
      });

      const zones =
        scored.rangeAvailable && scored.range?.bands?.length
          ? scored.range.bands.map((b) => ({
              status: b.status,
              min: b.min,
              max: b.max,
            }))
          : null;

      const existing = byId.get(m.biomarkerId);
      const point: BiomarkerTrendPoint = {
        reportId: report.id,
        at: reportTimelineAt(report),
        value: m.value,
        status: scored.status,
        labStatus: scored.labStatus,
        rangeAvailable: scored.rangeAvailable,
      };

      if (existing) {
        existing.points.push(point);
        if (!existing.name && m.name) existing.name = m.name;
        if (!existing.unit && m.unit) existing.unit = m.unit;
        // Prefer latest report's zones (demographic may change)
        if (zones) existing.zones = zones;
      } else {
        byId.set(m.biomarkerId, {
          biomarkerId: m.biomarkerId,
          name: m.name || m.biomarkerId,
          unit: m.unit || scored.range?.unit || "",
          sectionId: scored.range?.sectionId ?? "other",
          points: [point],
          zones,
        });
      }
    }
  }

  return [...byId.values()]
    .map((series) => {
      const last = series.points[series.points.length - 1];
      const prev = series.points[series.points.length - 2];
      const delta = last && prev ? last.value - prev.value : null;
      const deltaPercent =
        delta != null && prev && prev.value !== 0
          ? (delta / prev.value) * 100
          : null;
      return { ...series, delta, deltaPercent };
    })
    .sort(compareTrendSeriesOrder);
}

function sectionRank(sectionId: string): number {
  const i = SECTION_ORDER.indexOf(sectionId);
  return i === -1 ? SECTION_ORDER.length : i;
}

function compareTrendSeriesOrder(
  a: Pick<BiomarkerTrendSeries, "biomarkerId" | "sectionId" | "name">,
  b: Pick<BiomarkerTrendSeries, "biomarkerId" | "sectionId" | "name">,
): number {
  const sectionDelta = sectionRank(a.sectionId) - sectionRank(b.sectionId);
  if (sectionDelta !== 0) return sectionDelta;
  const ac = CATALOG_INDEX.get(a.biomarkerId) ?? Number.MAX_SAFE_INTEGER;
  const bc = CATALOG_INDEX.get(b.biomarkerId) ?? Number.MAX_SAFE_INTEGER;
  if (ac !== bc) return ac - bc;
  return a.name.localeCompare(b.name);
}

/** Build report-style detail payload from the latest point on a trend series. */
export function detailFromTrendSeries(
  series: BiomarkerTrendSeries,
  demographic: Demographic,
): { biomarker: Biomarker; population: PopulationComparison } | null {
  const latest = series.points[series.points.length - 1];
  if (!latest) return null;

  const scored = scoreBiomarker({
    biomarkerId: series.biomarkerId,
    value: latest.value,
    demographic,
  });
  const explanation = getBiomarkerExplanation(series.biomarkerId);
  const needsAction =
    scored.status === "fair" || scored.status === "attention";

  const biomarker: Biomarker = {
    id: series.biomarkerId,
    name: series.name,
    subtitle: scored.range?.subtitle,
    unit: series.unit || scored.range?.unit || "",
    value: scored.value,
    range: scored.range,
    status: scored.status,
    labStatus: scored.labStatus,
    sourceRefs: scored.sourceRefs,
    sectionId: series.sectionId,
    explanation: explanation?.summary,
    recommendedAction: needsAction
      ? (explanation?.discussWithClinician ??
        "Commonly influenced by lifestyle factors — consider discussing with your doctor")
      : undefined,
  };

  const population = compareToPopulation({
    biomarkerId: series.biomarkerId,
    value: biomarker.value,
    demographic,
    valueUnit: biomarker.unit || scored.range?.unit,
  });

  return { biomarker, population };
}
