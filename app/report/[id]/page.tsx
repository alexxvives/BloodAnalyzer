"use client";

import { Page, PageBody, PageHeader } from "@/components/layout/Page";
import {
  ReportView,
  reportSubjectLine,
} from "@/components/report/ReportView";
import type { ExtractedMarker } from "@/lib/extraction/types";
import { loadReportDraft } from "@/lib/report/draft";
import type { Demographic, DemographicSex } from "@/lib/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type LoadedReport = {
  markers: ExtractedMarker[];
  demographic: Demographic;
  sourceFileName?: string;
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
            sourceFileName: string | null;
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
            markers,
            demographic,
            sourceFileName: data.report.sourceFileName ?? undefined,
            createdAt: data.report.createdAt,
            demographicFallback: fromReport == null,
          });
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

  return (
    <Page>
      <PageHeader
        eyebrow="Saved report"
        title={report ? formatReportTitle(report.createdAt) : "Report"}
        description={
          report
            ? reportSubjectLine(report.demographic, report.sourceFileName)
            : undefined
        }
        actions={
          <Link href="/history" className="ba-btn ba-btn-secondary">
            All uploads
          </Link>
        }
      />
      <PageBody>
        {state === "loading" ? (
          <p className="text-sm text-muted">Loading report…</p>
        ) : null}

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
            <ReportView
              markers={report.markers}
              demographic={report.demographic}
            />
          </>
        ) : null}
      </PageBody>
    </Page>
  );
}

function formatReportTitle(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Saved report";
  return d.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
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
