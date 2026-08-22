"use client";

import {
  SectionDemographicBadge,
} from "@/components/report/ReportSection";
import { BiomarkerDetailPanel } from "@/components/report/BiomarkerDetailPanel";
import { ReportOverviewCards } from "@/components/report/ReportOverviewCards";
import { BiomarkerTrendChart } from "@/components/ui/BiomarkerChart";
import {
  SectionScoreRing,
  sectionPercentStatus,
} from "@/components/ui/SectionScoreRing";
import { HomeDashboardSkeleton } from "@/components/ui/Skeleton";
import { GradeBadge, LabBadge } from "@/components/ui/StatusBadge";
import type { Demographic } from "@/lib/types";
import {
  detailFromTrendSeries,
  type BiomarkerTrendSeries,
} from "@/lib/report/biomarker-trends";
import {
  formatLabNumber,
  labDisplayScale,
  sampleMagnitudeForScale,
  toDisplayNumber,
} from "@/lib/report/format-lab-number";
import {
  SECTION_ORDER,
  SECTION_TITLES,
  sectionOptimizationPercent,
  sectionPopulationSummary,
  type ReportSection,
} from "@/lib/report/build-report";
import type { ReportViewModel } from "@/lib/report/report-dto";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type HomeReport = {
  id: string;
  createdAt: string;
  collectedAt?: string | null;
  sourceFileName: string | null;
  markerCount: number;
  overallPct: number | null;
  demographic?: Demographic;
};

type HomePayload = {
  reports: HomeReport[];
  trends: BiomarkerTrendSeries[];
  latestReport: { id: string; model: ReportViewModel } | null;
};

type TrendSection = {
  id: string;
  title: string;
  trends: BiomarkerTrendSeries[];
  reportSection: ReportSection;
  pct: number | null;
};

export function HomeView() {
  const [data, setData] = useState<HomePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/reports/history")
      .then(async (res) => {
        if (res.status === 401) throw new Error("Please log in.");
        const json = (await res.json()) as HomePayload & { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Could not load home.");
        if (!cancelled) {
          setData({
            reports: json.reports,
            trends: json.trends,
            latestReport: json.latestReport ?? null,
          });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load home.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sectionDemographic = useMemo((): Demographic => {
    return data?.reports[0]?.demographic ?? { sex: "male", ageYears: 30 };
  }, [data]);

  const sections = useMemo(
    () => groupTrendsBySection(data?.trends ?? [], sectionDemographic),
    [data, sectionDemographic],
  );

  const detailDemographic = useMemo((): Demographic => {
    const reports = data?.reports ?? [];
    const selected = data?.trends.find((t) => t.biomarkerId === selectedId);
    const reportId = selected?.points[selected.points.length - 1]?.reportId;
    const fromReport = reports.find((r) => r.id === reportId)?.demographic;
    return fromReport ?? sectionDemographic;
  }, [data, selectedId, sectionDemographic]);

  const selectedDetail = useMemo(() => {
    if (!selectedId || !data) return null;
    const series = data.trends.find((t) => t.biomarkerId === selectedId);
    if (!series) return null;
    return detailFromTrendSeries(series, detailDemographic);
  }, [selectedId, data, detailDemographic]);

  if (error) {
    return (
      <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-status-attention">
        {error}
      </p>
    );
  }

  if (!data) {
    return <HomeDashboardSkeleton />;
  }

  if (data.reports.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-border bg-surface px-8 py-12 text-center shadow-sm">
        <p className="font-[family-name:var(--font-fraunces)] text-3xl tracking-tight">
          Your progress home
        </p>
        <p className="mt-3 text-sm text-muted">
          Upload a blood test to start tracking biomarkers over time. Each
          confirmed analytic becomes a point on your timelines.
        </p>
        <Link href="/upload" className="ba-btn ba-btn-primary mt-8">
          Upload results
        </Link>
      </div>
    );
  }

  const latest = data.latestReport;

  return (
    <div className="space-y-10">
      {latest ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Latest upload
            </p>
            <Link
              href={`/report/${latest.id}`}
              className="text-xs font-medium text-accent hover:underline"
            >
              Open full report →
            </Link>
          </div>
          <ReportOverviewCards
            model={latest.model}
            sectionHref={(sectionId) => `/report/${latest.id}#${sectionId}`}
          />
        </div>
      ) : null}

      <div className="space-y-12">
        {sections.map((section) => {
          const ringStatus =
            section.pct != null ? sectionPercentStatus(section.pct) : undefined;
          const caption =
            ringStatus === "optimal" || ringStatus === "good"
              ? "In range"
              : ringStatus === "fair"
                ? "Mixed"
                : ringStatus === "attention"
                  ? "Needs review"
                  : undefined;
          const population = sectionPopulationSummary(
            section.reportSection,
            sectionDemographic,
          );

          return (
            <section key={section.id} className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <h2 className="font-[family-name:var(--font-fraunces)] text-3xl tracking-tight">
                  {section.title}
                </h2>

                {section.pct != null ? (
                  <div className="mt-6 flex flex-col items-center gap-3">
                    <SectionScoreRing
                      percent={section.pct}
                      status={ringStatus}
                      label="optimization score"
                      size={128}
                      caption={caption}
                    />
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted">
                    Score not available — no graded markers in this section.
                  </p>
                )}

                <div className="mt-3">
                  <SectionDemographicBadge summary={population} />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {section.trends.map((series) => (
                  <TrendCard
                    key={series.biomarkerId}
                    series={series}
                    onSelect={() => setSelectedId(series.biomarkerId)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {selectedDetail ? (
        <BiomarkerDetailPanel
          biomarker={selectedDetail.biomarker}
          population={selectedDetail.population}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}

function groupTrendsBySection(
  trends: BiomarkerTrendSeries[],
  demographic: Demographic,
): TrendSection[] {
  const byId = new Map<string, BiomarkerTrendSeries[]>();
  for (const series of trends) {
    const list = byId.get(series.sectionId) ?? [];
    list.push(series);
    byId.set(series.sectionId, list);
  }

  const sections: TrendSection[] = [];
  for (const id of SECTION_ORDER) {
    const list = byId.get(id);
    if (!list?.length) continue;
    sections.push(buildTrendSection(id, list, demographic));
    byId.delete(id);
  }
  for (const [id, list] of byId) {
    if (!list.length) continue;
    sections.push(buildTrendSection(id, list, demographic));
  }
  return sections;
}

function buildTrendSection(
  id: string,
  trends: BiomarkerTrendSeries[],
  demographic: Demographic,
): TrendSection {
  const title = SECTION_TITLES[id] ?? SECTION_TITLES.other;
  const biomarkers = trends
    .map((series) => detailFromTrendSeries(series, demographic))
    .filter((entry): entry is NonNullable<typeof entry> => entry != null);
  const reportSection: ReportSection = { id, title, biomarkers };
  return {
    id,
    title,
    trends,
    reportSection,
    pct: sectionOptimizationPercent(reportSection),
  };
}

function TrendCard({
  series,
  onSelect,
}: {
  series: BiomarkerTrendSeries;
  onSelect: () => void;
}) {
  const latest = series.points[series.points.length - 1];
  const scale = labDisplayScale(
    series.unit,
    sampleMagnitudeForScale({ value: latest?.value }),
  );
  const display =
    latest == null ? null : toDisplayNumber(latest.value, scale);

  return (
    <article className="ba-reveal relative rounded-2xl border border-border bg-surface p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-accent-soft/35 hover:shadow-lg hover:shadow-accent/15">
      <button
        type="button"
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={`Open details for ${series.name}`}
        onClick={onSelect}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-[family-name:var(--font-fraunces)] text-xl tracking-tight">
              {series.name}
            </h3>
            {latest ? (
              <div className="flex flex-wrap gap-1.5">
                <LabBadge status={latest.labStatus} />
                {latest.rangeAvailable ? (
                  <GradeBadge status={latest.status} />
                ) : (
                  <GradeBadge status={null} />
                )}
              </div>
            ) : null}
          </div>
        </div>
        {latest ? (
          <div className="shrink-0 text-right">
            <p className="font-[family-name:var(--font-fraunces)] text-2xl tabular-nums tracking-tight">
              {display == null ? "—" : formatLabNumber(display)}
              <span className="ml-1 text-sm text-muted">{scale.unit}</span>
              {series.deltaPercent != null && series.points.length >= 2 ? (
                <span
                  className={`ml-2 align-middle text-xs font-medium tabular-nums ${
                    series.deltaPercent !== 0
                      ? "text-status-attention"
                      : "text-muted"
                  }`}
                >
                  {series.deltaPercent > 0 ? "+" : ""}
                  {series.deltaPercent.toFixed(0)}%
                </span>
              ) : null}
            </p>
          </div>
        ) : null}
      </div>

      <div className="relative mt-4 pointer-events-none">
        <BiomarkerTrendChart series={series} />
      </div>
    </article>
  );
}

