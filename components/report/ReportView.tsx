"use client";

import { BiomarkerDetailPanel } from "@/components/report/BiomarkerDetailPanel";
import { ReportOverviewCards } from "@/components/report/ReportOverviewCards";
import { ReportSectionBlock } from "@/components/report/ReportSection";
import type { ReportViewModel } from "@/lib/report/report-dto";
import type { Demographic } from "@/lib/types";
import { useState } from "react";

type ReportViewProps = {
  /** Server-built report payload — preferred path (S3). */
  model: ReportViewModel;
};

/** Subject line shown in the page header above a report. */
export function reportSubjectLine(
  demographic: Demographic,
  sourceFileName?: string,
): string {
  const base = `${demographic.sex}, age ${demographic.ageYears}`;
  return sourceFileName ? `${base} · ${sourceFileName}` : base;
}

/**
 * Presentational report UI. Scoring / data JSON must be built server-side
 * via `buildReportViewModel` or `/api/reports/build`.
 */
export function ReportView({ model }: ReportViewProps) {
  const { demographic, sections } = model;

  const [selected, setSelected] = useState<{
    sectionId: string;
    biomarkerId: string;
  } | null>(null);

  const selectedItem = findSelected(sections, selected);

  return (
    <div className="space-y-10">
      <ReportOverviewCards
        model={model}
        sectionHref={(id) => `#${id}`}
      />

      {sections.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-6 text-muted">
          No mapped markers to display. Go back and assign biomarker ids on the
          confirmation screen.
        </p>
      ) : null}

      {sections.map((section) => (
        <ReportSectionBlock
          key={section.id}
          section={section}
          demographic={demographic}
          onSelect={(biomarkerId) =>
            setSelected({ sectionId: section.id, biomarkerId })
          }
        />
      ))}

      {selectedItem ? (
        <BiomarkerDetailPanel
          biomarker={selectedItem.biomarker}
          population={selectedItem.population}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}

function findSelected(
  sections: ReportViewModel["sections"],
  selected: { sectionId: string; biomarkerId: string } | null,
) {
  if (!selected) return null;
  const section = sections.find((s) => s.id === selected.sectionId);
  return (
    section?.biomarkers.find((b) => b.biomarker.id === selected.biomarkerId) ??
    null
  );
}
