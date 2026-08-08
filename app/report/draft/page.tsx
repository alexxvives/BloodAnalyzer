"use client";

import { Page, PageBody, PageHeader } from "@/components/layout/Page";
import {
  ReportView,
  reportSubjectLine,
} from "@/components/report/ReportView";
import { loadReportDraft, type ReportDraft } from "@/lib/report/draft";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DraftReportPage() {
  const [draft, setDraft] = useState<ReportDraft | null | undefined>(undefined);

  useEffect(() => {
    setDraft(loadReportDraft());
  }, []);

  return (
    <Page>
      <PageHeader
        eyebrow="Report"
        title="Your bloodwork"
        description={
          draft
            ? reportSubjectLine(draft.demographic, draft.sourceFileName)
            : undefined
        }
        actions={
          <Link href="/upload" className="ba-btn ba-btn-secondary">
            New upload
          </Link>
        }
      />
      <PageBody>
        {draft === undefined ? (
          <p className="text-sm text-muted">Loading draft…</p>
        ) : draft == null ? (
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-surface p-8 text-center shadow-sm">
            <p className="font-[family-name:var(--font-fraunces)] text-2xl tracking-tight text-foreground">
              No draft report yet
            </p>
            <p className="mt-2 text-sm text-muted">
              Upload a text-based lab PDF and confirm extracted values to build
              your draft.
            </p>
            <Link href="/upload" className="ba-btn ba-btn-primary mt-6">
              Go to upload
            </Link>
          </div>
        ) : (
          <ReportView markers={draft.markers} demographic={draft.demographic} />
        )}
      </PageBody>
    </Page>
  );
}
