"use client";

import { ActionPlanCard } from "@/components/report/ActionPlanCard";
import { BiomarkerCard } from "@/components/report/BiomarkerCard";
import { BiomarkerDetailPanel } from "@/components/report/BiomarkerDetailPanel";
import {
  SectionScoreRing,
  sectionPercentStatus,
} from "@/components/ui/SectionScoreRing";
import type { ActionPlanMarkerInput } from "@/lib/report/action-plan";
import {
  buildReportSections,
  sectionOptimizationPercent,
  sectionPopulationSummary,
  type ReportSection,
  type SectionPopulationSummary,
} from "@/lib/report/build-report";
import type { ExtractedMarker } from "@/lib/extraction";
import { estimateBiologicalAge } from "@/lib/scoring";
import type { Demographic } from "@/lib/types";
import { STATUS_CSS_VAR, STATUS_LABEL } from "@/lib/status-tokens";
import { useMemo, useState } from "react";

/** Health sections shown in the top summary list (excludes CBC / other). */
const SUMMARY_SECTION_IDS = [
  "lipid",
  "metabolic",
  "hormones",
  "kidney",
  "liver",
  "thyroid",
  "prostate",
  "vitamins",
] as const;

type ReportViewProps = {
  markers: ExtractedMarker[];
  demographic: Demographic;
};

/** Subject line shown in the page header above a report. */
export function reportSubjectLine(
  demographic: Demographic,
  sourceFileName?: string,
): string {
  const base = `${demographic.sex}, age ${demographic.ageYears}`;
  return sourceFileName ? `${base} · ${sourceFileName}` : base;
}

export function ReportView({ markers, demographic }: ReportViewProps) {
  const sections = useMemo(
    () => buildReportSections({ markers, demographic }),
    [markers, demographic],
  );
  const [selected, setSelected] = useState<{
    sectionId: string;
    biomarkerId: string;
  } | null>(null);

  const selectedItem = findSelected(sections, selected);
  const overview = useMemo(() => summarizeReport(sections), [sections]);
  const bioAge = useMemo(
    () =>
      estimateBiologicalAge({
        chronologicalAgeYears: demographic.ageYears,
        optimizationPercent: overview.pct,
        gradedMarkerCount: overview.graded,
      }),
    [demographic.ageYears, overview.pct, overview.graded],
  );
  const actionMarkers = useMemo(
    () => toActionPlanMarkers(sections),
    [sections],
  );
  const summarySections = useMemo(
    () =>
      SUMMARY_SECTION_IDS.map((id) => sections.find((s) => s.id === id)).filter(
        (s): s is ReportSection => Boolean(s),
      ),
    [sections],
  );

  return (
    <div className="space-y-10">
      <div className="grid gap-4 lg:grid-cols-3">
        <BiomarkerSummaryCard sections={summarySections} overview={overview} />
        <OverallScoreCard
          overview={overview}
          bioAge={bioAge}
          population={sectionPopulationSummary(
            {
              id: "all",
              title: "All",
              biomarkers: sections.flatMap((s) => s.biomarkers),
            },
            demographic,
          )}
        />
        <ActionPlanCard demographic={demographic} markers={actionMarkers} />
      </div>

      {sections.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-6 text-muted">
          No mapped markers to display. Go back and assign biomarker ids on the
          confirmation screen.
        </p>
      ) : null}

      {sections.map((section) => {
        const pct = sectionOptimizationPercent(section);
        const ringStatus =
          pct != null ? sectionPercentStatus(pct) : undefined;
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
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-6 space-y-6"
          >
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

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {section.biomarkers.map(({ biomarker }) => (
                <BiomarkerCard
                  key={biomarker.id}
                  biomarker={biomarker}
                  onSelect={() =>
                    setSelected({
                      sectionId: section.id,
                      biomarkerId: biomarker.id,
                    })
                  }
                />
              ))}
            </div>
          </section>
        );
      })}

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

function BiomarkerSummaryCard({
  sections,
  overview,
}: {
  sections: ReportSection[];
  overview: ReturnType<typeof summarizeReport>;
}) {
  const overallStatus =
    overview.pct == null ? null : sectionPercentStatus(overview.pct);
  const overallLabel =
    overallStatus == null
      ? "Ungraded"
      : overallStatus === "in_range"
        ? STATUS_LABEL.good
        : STATUS_LABEL[overallStatus];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
        <SearchIcon />
        Biomarker data summary
      </div>
      <p className="mt-2 font-[family-name:var(--font-fraunces)] text-2xl tracking-tight">
        {overallLabel}
      </p>
      <ul className="mt-4 space-y-2.5">
        {sections.length === 0 ? (
          <li className="text-sm text-muted">No health sections yet.</li>
        ) : null}
        {sections.map((section) => {
          const pct = sectionOptimizationPercent(section);
          const status = pct != null ? sectionPercentStatus(pct) : null;
          const color =
            status == null
              ? "var(--muted)"
              : status === "in_range"
                ? "var(--in-range)"
                : STATUS_CSS_VAR[status];
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="flex items-center gap-2.5 text-sm transition hover:text-accent"
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ background: color }}
                  aria-hidden
                >
                  <CheckMiniIcon />
                </span>
                <span className="min-w-0 flex-1 truncate text-foreground">
                  {section.title}
                </span>
                <span className="tabular-nums font-medium" style={{ color }}>
                  {pct != null ? `${pct}%` : "—"}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function OverallScoreCard({
  overview,
  bioAge,
  population,
}: {
  overview: ReturnType<typeof summarizeReport>;
  bioAge: ReturnType<typeof estimateBiologicalAge>;
  population: SectionPopulationSummary;
}) {
  const younger =
    bioAge.available && bioAge.deltaYears != null && bioAge.deltaYears < 0;
  const older =
    bioAge.available && bioAge.deltaYears != null && bioAge.deltaYears > 0;
  const absDelta =
    bioAge.deltaYears != null ? Math.abs(bioAge.deltaYears) : null;

  return (
    <div className="flex flex-col rounded-2xl border-2 border-accent/40 bg-surface p-5 shadow-sm">
      <div className="flex flex-1 flex-col items-center justify-center rounded-xl bg-surface-muted/60 px-4 py-6 text-center">
        {bioAge.available && bioAge.biologicalAgeYears != null ? (
          <>
            <p className="font-[family-name:var(--font-fraunces)] text-6xl leading-none tracking-tight text-accent">
              {bioAge.biologicalAgeYears}
            </p>
            <p className="mt-2 text-sm text-muted">Biological age</p>
          </>
        ) : (
          <>
            <p className="font-[family-name:var(--font-fraunces)] text-6xl leading-none tracking-tight text-accent">
              {overview.pct != null ? overview.pct : "—"}
              {overview.pct != null ? (
                <span className="text-2xl">%</span>
              ) : null}
            </p>
            <p className="mt-2 text-sm text-muted">Overall score</p>
          </>
        )}
      </div>

      {bioAge.available && absDelta != null ? (
        <p className="mt-4 text-center text-sm text-foreground">
          Your biological age is{" "}
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-sm font-medium ${
              younger
                ? "bg-accent-soft text-accent"
                : older
                  ? "bg-status-fair/15 text-status-fair"
                  : "bg-surface-muted text-muted"
            }`}
          >
            {younger || older
              ? `${absDelta} year${absDelta === 1 ? "" : "s"} ${
                  younger ? "younger" : "older"
                }`
              : "aligned"}
          </span>{" "}
          than your chronological age.
        </p>
      ) : (
        <p className="mt-4 text-center text-sm text-muted">
          Biological age needs at least 3 graded markers.
        </p>
      )}

      <div className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted">Overall score</span>
          <span className="font-[family-name:var(--font-fraunces)] text-xl tracking-tight text-foreground">
            {overview.pct != null ? `${overview.pct}%` : "—"}
          </span>
        </div>
        {population.available &&
        population.userPercent != null &&
        population.populationPercent != null &&
        population.scoreDelta != null ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted">Vs typical score</span>
            <span className="tabular-nums text-foreground">
              {population.userPercent}% vs {population.populationPercent}%
              <span className="ml-2 text-xs text-muted">
                ({scoreDeltaLabel(population)})
              </span>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function scoreDeltaLabel(summary: SectionPopulationSummary): string {
  if (summary.scoreDelta == null || summary.direction === "equal") {
    return "at typical";
  }
  const abs = Math.abs(summary.scoreDelta);
  const sign = summary.scoreDelta > 0 ? "+" : "−";
  return `${sign}${abs} pts vs typical`;
}

function SectionDemographicBadge({
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
      ? "At typical score"
      : scoreDeltaLabel(summary);
  const context = `typical ${summary.populationPercent}%`;

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
      <span className="text-xs text-muted">{context}</span>
    </div>
  );
}

function summarizeReport(sections: ReportSection[]) {
  const all = sections.flatMap((s) => s.biomarkers);
  const measured = all.filter((b) => !b.biomarker.notTested);
  const graded = measured.filter(
    (b) => b.biomarker.range?.sourced && b.biomarker.status != null,
  );
  return {
    total: measured.length,
    graded: graded.length,
    pct: sectionOptimizationPercent({
      id: "all",
      title: "All",
      biomarkers: graded,
    }),
  };
}

function toActionPlanMarkers(sections: ReportSection[]): ActionPlanMarkerInput[] {
  return sections.flatMap((section) =>
    section.biomarkers
      .filter(({ biomarker }) => !biomarker.notTested)
      .map(({ biomarker }) => ({
        id: biomarker.id,
        name: biomarker.name,
        section: section.title,
        value: biomarker.value,
        valueDisplay: biomarker.valueDisplay,
        unit: biomarker.unit,
        status: biomarker.status,
        labStatus: biomarker.labStatus,
      })),
  );
}

function findSelected(
  sections: ReportSection[],
  selected: { sectionId: string; biomarkerId: string } | null,
) {
  if (!selected) return null;
  const section = sections.find((s) => s.id === selected.sectionId);
  return (
    section?.biomarkers.find((b) => b.biomarker.id === selected.biomarkerId) ??
    null
  );
}

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function CheckMiniIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5 10 17l9-10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
