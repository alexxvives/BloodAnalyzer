"use client";

import { ReportView } from "@/components/report/ReportView";
import { ReportPageSkeleton } from "@/components/ui/Skeleton";
import type { ExtractedMarker } from "@/lib/extraction/types";
import type { ReportViewModel } from "@/lib/report/report-dto";
import type { Demographic } from "@/lib/types";
import { useEffect, useState } from "react";

type ReportLoaderProps = {
  markers: ExtractedMarker[];
  demographic: Demographic;
};

/**
 * Fetches a server-built report model so the client never loads
 * reference-range / population JSON for scoring.
 */
export function ReportLoader({ markers, demographic }: ReportLoaderProps) {
  const [model, setModel] = useState<ReportViewModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setModel(null);
    setError(null);

    void fetch("/api/reports/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markers, demographic }),
    })
      .then(async (res) => {
        if (res.status === 401) {
          throw new Error("Please log in to view this report.");
        }
        const data = (await res.json()) as {
          error?: string;
          report?: ReportViewModel;
        };
        if (!res.ok || !data.report) {
          throw new Error(data.error ?? "Could not build report.");
        }
        if (!cancelled) setModel(data.report);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not build report.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [markers, demographic]);

  if (error) {
    return (
      <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-status-attention">
        {error}
      </p>
    );
  }
  if (!model) {
    return <ReportPageSkeleton />;
  }
  return <ReportView model={model} />;
}
