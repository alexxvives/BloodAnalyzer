import { requireUser } from "@/lib/auth/session";
import { demographicFromReport } from "@/lib/db/types";
import { getReportRepository } from "@/lib/db/report-repository";
import { buildBiomarkerTrends } from "@/lib/report/biomarker-trends";
import {
  buildReportSections,
  sectionOptimizationPercent,
} from "@/lib/report/build-report";
import { buildReportViewModel } from "@/lib/report/report-dto";
import type { ExtractedMarker } from "@/lib/extraction/types";
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
      collectedAt: report.collectedAt,
      sourceFileName: report.sourceFileName,
      hasSourceFile: Boolean(report.sourceFileKey),
      demographic,
      demographicFallback: stored == null,
      markerCount: measured.length,
      gradedCount: graded.length,
      overallPct,
      statusCounts,
      sectionSummaries,
    };
  });

  const trends = buildBiomarkerTrends(rows);

  // Latest upload drives home overview cards (trends still use full history).
  const latestRow = rows[0];
  let latestReport = null;
  if (latestRow) {
    const extracted: ExtractedMarker[] = latestRow.markers.map((m) => ({
      biomarkerId: m.biomarkerId,
      name: m.name,
      value: m.value,
      valueDisplay: m.valueDisplay ?? undefined,
      unit: m.unit,
      confidence: 1,
    }));
    const demographic =
      demographicFromReport(latestRow.report) ?? FALLBACK_DEMOGRAPHIC;
    latestReport = {
      id: latestRow.report.id,
      model: buildReportViewModel({ markers: extracted, demographic }),
    };
  }

  return NextResponse.json({ reports, trends, latestReport });
}
