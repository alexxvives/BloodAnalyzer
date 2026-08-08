"use client";

import { Page, PageBody, PageHeader } from "@/components/layout/Page";
import Link from "next/link";
import { useEffect, useState } from "react";

type SectionSummary = {
  id: string;
  title: string;
  pct: number;
};

type StatusCounts = {
  optimal: number;
  good: number;
  fair: number;
  attention: number;
};

type HistoryReport = {
  id: string;
  createdAt: string;
  sourceFileName: string | null;
  markerCount: number;
  gradedCount: number;
  overallPct: number | null;
  statusCounts: StatusCounts;
  sectionSummaries: SectionSummary[];
};

type Trend = {
  biomarkerId: string;
  name: string;
  unit: string;
  points: number[];
};

export function HistoryView() {
  const [reports, setReports] = useState<HistoryReport[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/reports/history")
      .then(async (r) => {
        if (r.status === 401) {
          throw new Error("Sign in to see upload history.");
        }
        if (!r.ok) throw new Error("Could not load history");
        return r.json() as Promise<{
          reports: HistoryReport[];
          trends: Trend[];
        }>;
      })
      .then((data) => {
        if (cancelled) return;
        setReports(data.reports ?? []);
        setTrends(data.trends ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "History failed");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Page>
      <PageHeader
        eyebrow="Your uploads"
        title="History"
        description="Each card summarizes one upload: overall optimization score and how markers split across grades."
        actions={
          <Link href="/upload" className="ba-btn ba-btn-primary">
            New upload
          </Link>
        }
      />
      <PageBody width="narrow">
        {loading ? <p className="text-sm text-muted">Loading history…</p> : null}
        {error ? <p className="text-sm text-status-fair">{error}</p> : null}

        {!loading && !error && reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
            <p className="text-sm text-foreground">No uploads yet.</p>
            <Link
              href="/upload"
              className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
            >
              Upload a blood test →
            </Link>
          </div>
        ) : null}

        {trends.length > 0 ? (
          <section className="mb-8">
            <h2 className="ba-eyebrow">Changes across uploads</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {trends.map((t) => (
              <li
                key={t.biomarkerId}
                className="rounded-2xl border border-border bg-surface px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted">
                      {t.points[t.points.length - 1]?.toLocaleString()} {t.unit}
                      <span className="text-muted/70">
                        {" "}
                        · {t.points.length} uploads
                      </span>
                    </p>
                  </div>
                  <Sparkline values={t.points} />
                </div>
              </li>
            ))}
            </ul>
          </section>
        ) : null}

        <ul className="flex flex-col gap-3">
          {reports.map((report) => (
          <li key={report.id}>
            <Link
              href={`/report/${report.id}`}
              className="block rounded-2xl border border-border bg-surface p-4 transition hover:border-accent/40 hover:bg-surface-muted/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-[family-name:var(--font-fraunces)] text-lg tracking-tight">
                    {formatDate(report.createdAt)}
                  </p>
                  {report.sourceFileName ? (
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {report.sourceFileName}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted">
                    {report.markerCount} marker
                    {report.markerCount === 1 ? "" : "s"}
                    {report.gradedCount > 0
                      ? ` · ${report.gradedCount} graded`
                      : ""}
                  </p>
                </div>

                <div className="text-right">
                  {report.overallPct != null ? (
                    <>
                      <p className="font-[family-name:var(--font-fraunces)] text-3xl leading-none tracking-tight tabular-nums">
                        {report.overallPct}
                        <span className="text-lg text-muted">%</span>
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">
                        Overall
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted">Score unavailable</p>
                  )}
                </div>
              </div>

              {report.gradedCount > 0 ? (
                <div className="mt-4">
                  <GradeBar counts={report.statusCounts} total={report.gradedCount} />
                  <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
                    <li>
                      <span className="text-status-optimal">●</span>{" "}
                      {pctOf(report.statusCounts.optimal, report.gradedCount)}%
                      optimal
                    </li>
                    <li>
                      <span className="text-status-good">●</span>{" "}
                      {pctOf(report.statusCounts.good, report.gradedCount)}%
                      good
                    </li>
                    <li>
                      <span className="text-status-fair">●</span>{" "}
                      {pctOf(report.statusCounts.fair, report.gradedCount)}%
                      fair
                    </li>
                    <li>
                      <span className="text-status-attention">●</span>{" "}
                      {pctOf(report.statusCounts.attention, report.gradedCount)}%
                      attention
                    </li>
                  </ul>
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted">
                  No graded markers saved for this upload.
                </p>
              )}

              {report.sectionSummaries.length > 0 ? (
                <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {report.sectionSummaries.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-surface-muted/50 px-3 py-2 text-xs"
                    >
                      <span className="truncate text-muted">{s.title}</span>
                      <span className="tabular-nums font-medium text-foreground">
                        {s.pct}%
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Link>
          </li>
          ))}
        </ul>
      </PageBody>
    </Page>
  );
}

function pctOf(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

function GradeBar({
  counts,
  total,
}: {
  counts: StatusCounts;
  total: number;
}) {
  if (total <= 0) return null;
  const segments: Array<{ key: keyof StatusCounts; className: string }> = [
    { key: "optimal", className: "bg-status-optimal" },
    { key: "good", className: "bg-status-good" },
    { key: "fair", className: "bg-status-fair" },
    { key: "attention", className: "bg-status-attention" },
  ];
  return (
    <div className="flex h-2 overflow-hidden rounded-full bg-surface-muted">
      {segments.map(({ key, className }) => {
        const w = (counts[key] / total) * 100;
        if (w <= 0) return null;
        return (
          <div
            key={key}
            className={className}
            style={{ width: `${w}%` }}
            title={`${key}: ${counts[key]}`}
          />
        );
      })}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Sparkline({
  values,
  compact = false,
}: {
  values: number[];
  compact?: boolean;
}) {
  if (values.length < 2) return null;
  const w = compact ? 56 : 88;
  const h = compact ? 24 : 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (w - 4) + 2;
      const y = h - 3 - ((v - min) / span) * (h - 6);
      return `${x},${y}`;
    })
    .join(" ");
  const rising = values[values.length - 1]! >= values[0]!;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="shrink-0"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={rising ? "var(--status-fair)" : "var(--status-optimal)"}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
      />
    </svg>
  );
}
