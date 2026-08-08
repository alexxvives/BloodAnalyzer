"use client";

import { CloseButton } from "@/components/ui/CloseButton";
import { DetailRangeChart } from "@/components/ui/DetailRangeChart";
import { GradeBadge, LabBadge } from "@/components/ui/StatusBadge";
import { PopulationComparisonView } from "@/components/ui/PopulationComparison";
import {
  formatSourceCitation,
  getBiomarkerExplanation,
} from "@/lib/report/explanations";
import {
  buildBandLegendRows,
  displayScaleForMarker,
  formatLabRange,
} from "@/lib/report/format-bands";
import type { PopulationComparison } from "@/lib/scoring";
import type { Biomarker, BiomarkerStatus } from "@/lib/types";
import { STATUS_CSS_VAR } from "@/lib/status-tokens";
import { useEffect } from "react";

type BiomarkerDetailPanelProps = {
  biomarker: Biomarker;
  population: PopulationComparison;
  onClose: () => void;
};

export function BiomarkerDetailPanel({
  biomarker,
  population,
  onClose,
}: BiomarkerDetailPanelProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rangeAvailable =
    biomarker.range?.sourced === true && biomarker.range.bands.length > 0;
  const explanation =
    getBiomarkerExplanation(biomarker.id) ??
    (biomarker.explanation
      ? {
          summary: biomarker.explanation,
          whatItMeasures: biomarker.explanation,
          whyItMatters: "",
          understandingLevels: "",
          influencingFactors: [] as string[],
          discussWithClinician:
            biomarker.recommendedAction ??
            "Discuss this result with a qualified clinician.",
        }
      : null);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-sidebar/30">
      <button
        type="button"
        className="flex-1 cursor-default"
        aria-label="Close detail panel"
        onClick={onClose}
      />
      <aside className="flex h-full w-full max-w-md flex-col overflow-hidden border-l border-border bg-surface shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">{biomarker.name}</h2>
            {biomarker.subtitle ? (
              <p className="text-sm italic text-muted">{biomarker.subtitle}</p>
            ) : null}
          </div>
          <CloseButton onClick={onClose} label="Close detail panel" />
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <DetailRangeChart
            name={biomarker.name}
            unit={biomarker.unit}
            value={biomarker.value}
            valueDisplay={biomarker.valueDisplay}
            bands={rangeAvailable ? biomarker.range!.bands : []}
            labLow={biomarker.range?.labLow}
            labHigh={biomarker.range?.labHigh}
          />

          <div className="flex flex-wrap gap-2">
            <LabBadge status={biomarker.labStatus} />
            <GradeBadge status={rangeAvailable ? biomarker.status : null} />
          </div>

          {rangeAvailable ? (
            <RangeLegend
              labLow={biomarker.range!.labLow}
              labHigh={biomarker.range!.labHigh}
              bands={biomarker.range!.bands}
              unit={biomarker.unit}
              value={biomarker.value}
            />
          ) : null}

          <PopulationComparisonView
            comparison={population}
            unit={biomarker.unit}
            value={biomarker.value}
          />

          {explanation ? (
            <section className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-accent">
                  What is {biomarker.name}?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {explanation.summary}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {explanation.whatItMeasures}
                </p>
              </div>

              {explanation.whyItMatters ? (
                <div>
                  <h3 className="text-sm font-semibold">
                    Why is {biomarker.name} important?
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {explanation.whyItMatters}
                  </p>
                </div>
              ) : null}

              {explanation.understandingLevels ? (
                <div>
                  <h3 className="text-sm font-semibold">
                    How can I better understand my levels?
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {explanation.understandingLevels}
                  </p>
                </div>
              ) : null}

              {explanation.ifHigher?.length || explanation.ifLower?.length ? (
                <div>
                  <h3 className="text-sm font-semibold">
                    How can I support healthy levels?
                  </h3>
                  {explanation.ifHigher?.length ? (
                    <div className="mt-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">
                        If your value trends higher
                      </p>
                      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-muted">
                        {explanation.ifHigher.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {explanation.ifLower?.length ? (
                    <div className="mt-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">
                        If your value trends lower
                      </p>
                      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-muted">
                        {explanation.ifLower.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {explanation.influencingFactors.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold">
                    Commonly linked factors
                  </h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                    {explanation.influencingFactors.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {explanation.learnMore?.length ? (
                <div>
                  <h3 className="text-sm font-semibold">Where can I learn more?</h3>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {explanation.learnMore.map((link) => (
                      <li key={link.url}>
                        <a
                          href={link.url}
                          className="text-accent underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="rounded-xl border border-border bg-surface-muted/60 p-4">
                <h3 className="text-sm font-semibold">Discuss with a clinician</h3>
                <p className="mt-2 text-sm text-foreground">
                  {explanation.discussWithClinician}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Disclaimer: If you are concerned about any result, consult your
                  physician. This report is educational and is not medical advice.
                </p>
              </div>
            </section>
          ) : null}

          {biomarker.recommendedAction ? (
            <section className="rounded-xl border border-status-fair/40 bg-status-fair/10 p-4">
              <h3 className="text-sm font-semibold">Suggested next step</h3>
              <p className="mt-2 text-sm text-foreground">
                {biomarker.recommendedAction}
              </p>
            </section>
          ) : null}

          {biomarker.sourceRefs.length > 0 ? (
            <section>
              <h3 className="text-sm font-semibold">Range sources</h3>
              <ul className="mt-2 space-y-2 text-xs text-muted">
                {biomarker.sourceRefs.map((ref) => (
                  <li key={ref.label}>
                    {formatSourceCitation(ref.citation, ref.label)}
                    {ref.url ? (
                      <>
                        {" "}
                        <a
                          href={ref.url}
                          className="text-accent underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Link
                        </a>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function RangeLegend({
  labLow,
  labHigh,
  bands,
  unit,
  value,
}: {
  labLow?: number | null;
  labHigh?: number | null;
  bands: Array<{ status: BiomarkerStatus; min: number | null; max: number | null }>;
  unit: string;
  value?: number | null;
}) {
  const scale = displayScaleForMarker({
    unit,
    value,
    labLow,
    labHigh,
    bands,
  });
  const lab = formatLabRange(labLow, labHigh, unit, scale);
  const rows = buildBandLegendRows(bands, unit, scale);

  return (
    <div className="flex gap-4 rounded-xl border border-border bg-surface-muted/40 px-3 py-2.5 text-xs text-muted">
      <div className="min-w-0 flex-1 space-y-1.5">
        {rows.map((row) => (
          <p key={row.status} className="flex flex-wrap items-baseline gap-x-1">
            <span
              className="font-medium"
              style={{ color: STATUS_CSS_VAR[row.status] }}
            >
              {row.label}:
            </span>
            {row.range ? (
              <span>{row.range}</span>
            ) : (
              <span className="italic">not defined for this marker</span>
            )}
          </p>
        ))}
      </div>
      {lab ? (
        <div className="flex w-[8.5rem] shrink-0 flex-col items-center justify-center self-stretch text-center">
          <span className="font-medium text-foreground">Lab range</span>
          <span className="mt-1 block leading-snug">{lab}</span>
        </div>
      ) : null}
    </div>
  );
}
