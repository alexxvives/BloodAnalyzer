"use client";

import { Page, PageBody, PageHeader } from "@/components/layout/Page";
import { ReportLoader } from "@/components/report/ReportLoader";
import { ReportPageSkeleton } from "@/components/ui/Skeleton";
import type { ExtractedMarker } from "@/lib/extraction/types";
import {
  collectedAtToInputValue,
} from "@/lib/report/collected-at";
import { loadReportDraft } from "@/lib/report/draft";
import type { Demographic, DemographicSex } from "@/lib/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type LoadedReport = {
  id: string;
  markers: ExtractedMarker[];
  demographic: Demographic;
  sourceFileName?: string;
  hasSourceFile: boolean;
  collectedAt: string | null;
  createdAt: string;
  demographicFallback: boolean;
};

/** Only used for legacy rows that predate demographic persistence. */
const FALLBACK_DEMOGRAPHIC: Demographic = { sex: "male", ageYears: 30 };

export default function SavedReportPage() {
  const params = useParams<{ id: string }>();
  const [state, setState] = useState<
    "loading" | "error" | "ready" | "unauthorized"
  >("loading");
  const [report, setReport] = useState<LoadedReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateDraft, setDateDraft] = useState("");
  const [dateSaving, setDateSaving] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;

    void fetch(`/api/reports/${params.id}`)
      .then(async (res) => {
        if (res.status === 401) {
          if (!cancelled) setState("unauthorized");
          return;
        }
        if (res.status === 404) {
          throw new Error("Report not found.");
        }
        if (!res.ok) throw new Error("Could not load report.");
        const data = (await res.json()) as {
          report: {
            id: string;
            sourceFileName: string | null;
            sourceFileKey: string | null;
            collectedAt: string | null;
            createdAt: string;
            demographicSex: DemographicSex | null;
            demographicAgeYears: number | null;
          };
          markers: Array<{
            biomarkerId: string | null;
            name: string;
            value: number | null;
            valueDisplay: string | null;
            unit: string;
          }>;
        };

        const fromReport =
          data.report.demographicSex != null &&
          data.report.demographicAgeYears != null
            ? {
                sex: data.report.demographicSex,
                ageYears: data.report.demographicAgeYears,
              }
            : null;
        const draft = loadReportDraft();
        const demographic =
          fromReport ?? draft?.demographic ?? FALLBACK_DEMOGRAPHIC;

        const markers: ExtractedMarker[] = data.markers.map((m) => ({
          biomarkerId: m.biomarkerId,
          name: m.name,
          value: m.value,
          valueDisplay: m.valueDisplay ?? undefined,
          unit: m.unit,
          confidence: 1,
        }));

        if (!cancelled) {
          setReport({
            id: data.report.id,
            markers,
            demographic,
            sourceFileName: data.report.sourceFileName ?? undefined,
            hasSourceFile: Boolean(data.report.sourceFileKey),
            collectedAt: data.report.collectedAt,
            createdAt: data.report.createdAt,
            demographicFallback: fromReport == null,
          });
          setDateDraft(collectedAtToInputValue(data.report.collectedAt));
          setState("ready");
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load report.");
        setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function saveCollectedDate(next: string) {
    if (!report || !next.trim()) return;
    const previous = collectedAtToInputValue(report.collectedAt);
    if (next === previous) return;

    setDateSaving(true);
    setDateError(null);
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectedAt: next }),
      });
      const data = (await res.json()) as {
        error?: string;
        report?: { collectedAt: string | null };
      };
      if (!res.ok || !data.report) {
        throw new Error(data.error ?? "Could not update test date.");
      }
      setReport((prev) =>
        prev ? { ...prev, collectedAt: data.report!.collectedAt } : prev,
      );
      setDateDraft(collectedAtToInputValue(data.report.collectedAt));
    } catch (err) {
      setDateDraft(previous);
      setDateError(
        err instanceof Error ? err.message : "Could not update test date.",
      );
    } finally {
      setDateSaving(false);
    }
  }

  const titleDate = report?.collectedAt
    ? formatReportTitle(report.collectedAt)
    : "Report";

  return (
    <Page>
      <PageHeader
        title={titleDate}
        description={
          report ? (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <MetaChip>
                {capitalize(report.demographic.sex)}, age{" "}
                {report.demographic.ageYears}
              </MetaChip>
              {report.sourceFileName ? (
                <MetaChip truncated>{report.sourceFileName}</MetaChip>
              ) : (
                <MetaChip>Manual entry</MetaChip>
              )}
              <label className="inline-flex items-center gap-1.5 text-xs text-muted">
                <span>Test date</span>
                <input
                  type="date"
                  max={todayInputValue()}
                  disabled={dateSaving}
                  className="ba-field ba-field-sm w-auto py-0.5 text-xs text-foreground"
                  value={dateDraft}
                  onChange={(e) => setDateDraft(e.target.value)}
                  onBlur={() => void saveCollectedDate(dateDraft)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                />
              </label>
              {dateError ? (
                <span className="text-xs text-status-attention">{dateError}</span>
              ) : null}
            </span>
          ) : undefined
        }
        actions={
          report?.hasSourceFile ? (
            <a
              href={`/api/reports/${report.id}/file`}
              target="_blank"
              rel="noopener noreferrer"
              className="ba-btn ba-btn-secondary"
            >
              View original
            </a>
          ) : undefined
        }
      />
      <PageBody>
        {state === "loading" ? <ReportPageSkeleton /> : null}

        {state === "unauthorized" ? (
          <EmptyCard
            title="Sign in to view this report"
            body="Saved uploads are tied to your account."
            href="/?auth=login"
            cta="Log in"
          />
        ) : null}

        {state === "error" ? (
          <EmptyCard
            title="Report unavailable"
            body={error ?? "Could not load this upload."}
            href="/upload"
            cta="Go to upload"
          />
        ) : null}

        {state === "ready" && report ? (
          <>
            {report.demographicFallback ? (
              <p className="mb-4 rounded-xl border border-border bg-surface-muted/50 px-4 py-3 text-xs text-muted">
                Age/sex were not saved with this older upload. Scoring uses a
                temporary default until you re-upload with demographics
                confirmed.
              </p>
            ) : null}
            <ReportLoader
              markers={report.markers}
              demographic={report.demographic}
            />
          </>
        ) : null}
      </PageBody>
    </Page>
  );
}

function MetaChip({
  children,
  truncated,
}: {
  children: React.ReactNode;
  truncated?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-border bg-surface-muted/60 px-2.5 py-0.5 text-xs text-foreground ${
        truncated ? "max-w-[16rem] truncate" : ""
      }`}
    >
      {children}
    </span>
  );
}

function formatReportTitle(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Saved report";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function todayInputValue(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function capitalize(s: string): string {
  return s.length ? s[0]!.toUpperCase() + s.slice(1) : s;
}

function EmptyCard({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-border bg-surface p-8 text-center shadow-sm">
      <p className="font-[family-name:var(--font-fraunces)] text-2xl tracking-tight text-foreground">
        {title}
      </p>
      <p className="mt-2 text-sm text-muted">{body}</p>
      <Link href={href} className="ba-btn ba-btn-primary mt-6">
        {cta}
      </Link>
    </div>
  );
}
