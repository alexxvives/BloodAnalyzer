"use client";

import { Page, PageBody, PageHeader } from "@/components/layout/Page";
import { FilePreview } from "@/components/history/FilePreview";
import { HistoryListSkeleton } from "@/components/ui/Skeleton";
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
  collectedAt?: string | null;
  sourceFileName: string | null;
  hasSourceFile?: boolean;
  markerCount: number;
  gradedCount: number;
  overallPct: number | null;
  statusCounts: StatusCounts;
  sectionSummaries: SectionSummary[];
};

export function HistoryView() {
  const [reports, setReports] = useState<HistoryReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function load() {
      void fetch("/api/reports/history")
        .then(async (r) => {
          if (r.status === 401) {
            throw new Error("Sign in to see upload history.");
          }
          if (!r.ok) throw new Error("Could not load history");
          return r.json() as Promise<{
            reports: HistoryReport[];
          }>;
        })
        .then((data) => {
          if (cancelled) return;
          setReports(data.reports ?? []);
          setError(null);
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "History failed");
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    load();
    const onChanged = () => load();
    window.addEventListener("ba:reports-changed", onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener("ba:reports-changed", onChanged);
    };
  }, []);

  async function deleteReport(id: string) {
    const prev = reports;
    setReports((items) => items.filter((r) => r.id !== id));
    const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setReports(prev);
      return;
    }
    window.dispatchEvent(new Event("ba:reports-changed"));
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Your uploads"
        title="History"
        description="Each card summarizes one upload: overall optimization score and how markers split across grades."
      />
      <PageBody width="narrow">
        {loading ? <HistoryListSkeleton /> : null}
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

        <ul className="flex flex-col gap-4 pt-2">
          {reports.map((report) => (
            <li key={report.id} className="relative flex items-stretch gap-3 overflow-visible">
              <div className="group/card relative min-w-0 flex-1 rounded-2xl border border-border bg-surface p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-accent-soft/30 hover:shadow-lg hover:shadow-accent/12">
                <button
                  type="button"
                  title="Delete upload"
                  aria-label="Delete upload"
                  className="absolute -right-2.5 -top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface text-status-attention opacity-0 shadow-sm transition hover:bg-status-attention hover:text-white group-hover/card:opacity-100 focus-visible:opacity-100"
                  onClick={() => void deleteReport(report.id)}
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-[family-name:var(--font-fraunces)] text-lg tracking-tight">
                      {formatDate(report.collectedAt ?? report.createdAt)}
                    </p>
                    {report.sourceFileName ? (
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {report.sourceFileName}
                      </p>
                    ) : null}
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
                    <GradeBar
                      counts={report.statusCounts}
                      total={report.gradedCount}
                    />
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
                        {pctOf(
                          report.statusCounts.attention,
                          report.gradedCount,
                        )}
                        % attention
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
              </div>

              <div className="flex w-36 shrink-0 flex-col gap-2 self-stretch">
                {report.hasSourceFile ? (
                  <FilePreview
                    reportId={report.id}
                    fileName={report.sourceFileName}
                  />
                ) : (
                  <div className="flex min-h-24 flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted/40 px-2 text-center text-[10px] text-muted">
                    No file
                  </div>
                )}
                <Link
                  href={`/report/${report.id}`}
                  className="ba-btn ba-btn-primary w-full shrink-0 justify-center px-2 py-2 text-xs"
                >
                  Open report
                </Link>
              </div>
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

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
