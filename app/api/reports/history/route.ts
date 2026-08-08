import { requireUser } from "@/lib/auth/session";
import { demographicFromReport } from "@/lib/db/types";
import { getReportRepository } from "@/lib/db/report-repository";
import {
  buildReportSections,
  sectionOptimizationPercent,
} from "@/lib/report/build-report";
import type { ExtractedMarker } from "@/lib/extraction";
import type { Demographic } from "@/lib/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Legacy rows without a saved demographic — labeled in response, not silent. */
const FALLBACK_DEMOGRAPHIC: Demographic = { sex: "male", ageYears: 30 };

/**
 * Upload history with per-report optimization summary (not random marker chips).
 */
export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rows;
  try {
    rows = await (
      await getReportRepository()
    ).listReportsWithMarkersForUser(user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Storage unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const reports = rows.map(({ report, markers }) => {
    const extracted: ExtractedMarker[] = markers.map((m) => ({
      biomarkerId: m.biomarkerId,
      name: m.name,
      value: m.value,
      valueDisplay: m.valueDisplay ?? undefined,
      unit: m.unit,
      confidence: 1,
    }));

    const stored = demographicFromReport(report);
    const demographic = stored ?? FALLBACK_DEMOGRAPHIC;

    const sections = buildReportSections({
      markers: extracted,
      demographic,
    });

    const measured = sections
      .flatMap((s) => s.biomarkers)
      .filter((b) => !b.biomarker.notTested);
    const graded = measured.filter(
      (b) => b.biomarker.range?.sourced && b.biomarker.status != null,
    );

    const overallPct = sectionOptimizationPercent({
      id: "all",
      title: "All",
      biomarkers: graded,
    });

    const statusCounts = {
      optimal: 0,
      good: 0,
      fair: 0,
      attention: 0,
    };
    for (const b of graded) {
      const s = b.biomarker.status;
      if (s && s in statusCounts) statusCounts[s] += 1;
    }

    const sectionSummaries = sections
      .map((section) => {
        const pct = sectionOptimizationPercent({
          ...section,
          biomarkers: section.biomarkers.filter((b) => !b.biomarker.notTested),
        });
        if (pct == null) return null;
        return { id: section.id, title: section.title, pct };
      })
      .filter(Boolean)
      .slice(0, 4) as Array<{ id: string; title: string; pct: number }>;

    return {
      id: report.id,
      createdAt: report.createdAt,
      sourceFileName: report.sourceFileName,
      demographic,
      demographicFallback: stored == null,
      markerCount: measured.length,
      gradedCount: graded.length,
      overallPct,
      statusCounts,
      sectionSummaries,
    };
  });

  // Cross-upload series for shared biomarker ids (oldest → newest).
  const TREND_IDS = [
    "ldl-cholesterol",
    "hdl-cholesterol",
    "triglycerides",
    "glucose-fasting",
    "hemoglobin",
    "ferritin",
    "vitamin-d",
    "crp",
    "alt",
    "tsh",
  ];
  const seriesMap = new Map<
    string,
    { biomarkerId: string; name: string; unit: string; points: number[] }
  >();
  for (const row of [...rows].reverse()) {
    for (const m of row.markers) {
      if (!m.biomarkerId || typeof m.value !== "number") continue;
      if (!TREND_IDS.includes(m.biomarkerId) && seriesMap.size >= 8) continue;
      const key = m.biomarkerId;
      const existing = seriesMap.get(key);
      if (existing) {
        existing.points.push(m.value);
      } else if (TREND_IDS.includes(key) || seriesMap.size < 6) {
        seriesMap.set(key, {
          biomarkerId: key,
          name: m.name,
          unit: m.unit,
          points: [m.value],
        });
      }
    }
  }

  const trends = [...seriesMap.values()]
    .filter((s) => s.points.length >= 2)
    .slice(0, 6);

  return NextResponse.json({ reports, trends });
}
