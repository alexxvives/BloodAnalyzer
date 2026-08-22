"use client";

import { BiomarkerCard } from "@/components/report/BiomarkerCard";
import {
  SectionScoreRing,
  sectionPercentStatus,
} from "@/components/ui/SectionScoreRing";
import {
  sectionOptimizationPercent,
  sectionPopulationSummary,
  type ReportSection as ReportSectionData,
  type SectionPopulationSummary,
} from "@/lib/report/build-report";
import type { Demographic } from "@/lib/types";
import { STATUS_CSS_VAR } from "@/lib/status-tokens";

type ReportSectionProps = {
  section: ReportSectionData;
  demographic: Demographic;
  onSelect: (biomarkerId: string) => void;
};

/**
 * One catalog-driven report section (Heart Health, Metabolic, …).
 * Prefer this over bespoke per-panel components — data comes from PANEL_CATALOG.
 */
export function ReportSectionBlock({
  section,
  demographic,
  onSelect,
}: ReportSectionProps) {
  const pct = sectionOptimizationPercent(section);
  const ringStatus = pct != null ? sectionPercentStatus(pct) : undefined;
  const population = sectionPopulationSummary(section, demographic);
  const caption =
    ringStatus === "optimal" || ringStatus === "good"
      ? "In range"
      : ringStatus === "fair"
        ? "Mixed"
        : ringStatus === "attention"
          ? "Needs review"
          : undefined;

  return (
    <section id={section.id} className="scroll-mt-6 space-y-6">
      <div className="flex flex-col items-center text-center">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl tracking-tight">
          {section.title}
        </h2>

        {pct != null ? (
          <div className="mt-6 flex flex-col items-center gap-3">
            <SectionScoreRing
              percent={pct}
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

      <div className="grid gap-3 sm:grid-cols-2">
        {section.biomarkers.map(({ biomarker }) => (
          <BiomarkerCard
            key={biomarker.id}
            biomarker={biomarker}
            onSelect={() => onSelect(biomarker.id)}
          />
        ))}
      </div>
    </section>
  );
}

export function SectionDemographicBadge({
  summary,
}: {
  summary: SectionPopulationSummary;
}) {
  if (
    !summary.available ||
    summary.scoreDelta == null ||
    summary.populationPercent == null
  ) {
    return null;
  }

  const deltaText =
    summary.direction === "equal"
      ? "At average score"
      : scoreDeltaLabel(summary);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
          summary.direction === "above"
            ? "bg-status-optimal/20 text-status-optimal"
            : summary.direction === "below"
              ? "bg-status-fair/20 text-status-fair"
              : "bg-surface-muted text-muted"
        }`}
        aria-hidden
      >
        {summary.direction === "above"
          ? "↑"
          : summary.direction === "below"
            ? "↓"
            : "·"}
      </span>
      <span
        className={`text-xs font-semibold ${
          summary.direction === "above"
            ? "text-status-optimal"
            : summary.direction === "below"
              ? "text-status-fair"
              : "text-muted"
        }`}
      >
        {deltaText}
      </span>
    </div>
  );
}

function scoreDeltaLabel(summary: SectionPopulationSummary): string {
  if (summary.scoreDelta == null || summary.direction === "equal") {
    return "at average";
  }
  const abs = Math.abs(summary.scoreDelta);
  const sign = summary.scoreDelta > 0 ? "+" : "−";
  return `${sign}${abs} pts vs average`;
}

/** Re-export color helper for summary lists that mirror section status. */
export function sectionStatusColor(
  status: ReturnType<typeof sectionPercentStatus> | null,
): string {
  if (status == null) return "var(--muted)";
  if (status === "in_range") return "var(--in-range)";
  return STATUS_CSS_VAR[status];
}
