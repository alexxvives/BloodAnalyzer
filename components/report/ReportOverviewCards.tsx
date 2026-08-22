"use client";

import { ActionPlanCard } from "@/components/report/ActionPlanCard";
import {
  sectionStatusColor,
} from "@/components/report/ReportSection";
import { sectionPercentStatus } from "@/components/ui/SectionScoreRing";
import {
  sectionOptimizationPercent,
  type ReportSection,
  type SectionPopulationSummary,
} from "@/lib/report/build-report";
import type { ReportViewModel } from "@/lib/report/report-dto";
import type { BiologicalAgeEstimate } from "@/lib/scoring/biological-age";
import { STATUS_LABEL } from "@/lib/status-tokens";
import Link from "next/link";

type ReportOverviewCardsProps = {
  model: ReportViewModel;
  /** Optional section link target (report page uses hash anchors). */
  sectionHref?: (sectionId: string) => string;
};

/** Top three overview cards shared by report and home. */
export function ReportOverviewCards({
  model,
  sectionHref,
}: ReportOverviewCardsProps) {
  const {
    demographic,
    summarySections,
    overview,
    bioAge,
    actionMarkers,
    overallPopulation,
  } = model;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <BiomarkerSummaryCard
        sections={summarySections}
        overview={overview}
        sectionHref={sectionHref}
      />
      <OverallScoreCard
        overview={overview}
        bioAge={bioAge}
        population={overallPopulation}
      />
      <ActionPlanCard demographic={demographic} markers={actionMarkers} />
    </div>
  );
}

function BiomarkerSummaryCard({
  sections,
  overview,
  sectionHref,
}: {
  sections: ReportSection[];
  overview: ReportViewModel["overview"];
  sectionHref?: (sectionId: string) => string;
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
          const color = sectionStatusColor(status);
          const href = sectionHref?.(section.id);
          const row = (
            <>
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
            </>
          );
          return (
            <li key={section.id}>
              {href ? (
                href.startsWith("#") ? (
                  <a
                    href={href}
                    className="flex items-center gap-2.5 text-sm transition hover:text-accent"
                  >
                    {row}
                  </a>
                ) : (
                  <Link
                    href={href}
                    className="flex items-center gap-2.5 text-sm transition hover:text-accent"
                  >
                    {row}
                  </Link>
                )
              ) : (
                <div className="flex items-center gap-2.5 text-sm">{row}</div>
              )}
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
  overview: ReportViewModel["overview"];
  bioAge: BiologicalAgeEstimate;
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
            <span className="text-muted">Vs average score</span>
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
    return "at average";
  }
  const abs = Math.abs(summary.scoreDelta);
  const sign = summary.scoreDelta > 0 ? "+" : "−";
  return `${sign}${abs} pts vs average`;
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
