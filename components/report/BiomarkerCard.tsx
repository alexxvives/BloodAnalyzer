"use client";

import { GradeBadge, LabBadge } from "@/components/ui/StatusBadge";
import { RangeBar } from "@/components/ui/BiomarkerChart";
import {
  formatLabNumber,
  labDisplayScale,
  sampleMagnitudeForScale,
  toDisplayNumber,
} from "@/lib/report/format-lab-number";
import type { Biomarker } from "@/lib/types";

export type BiomarkerCardProps = {
  biomarker: Biomarker;
  onSelect?: (biomarker: Biomarker) => void;
};

export function BiomarkerCard({ biomarker, onSelect }: BiomarkerCardProps) {
  const {
    name,
    subtitle,
    unit,
    value,
    valueDisplay,
    status,
    labStatus,
    range,
    recommendedAction,
    notTested,
    suggestedTest,
    suggestedTestReason,
  } = biomarker;

  const scale = labDisplayScale(
    unit,
    sampleMagnitudeForScale({
      value,
      labLow: range?.labLow,
      labHigh: range?.labHigh,
      bandEdges: range?.bands?.flatMap((b) => [b.min, b.max]),
    }),
  );
  const displayUnit = scale.unit;
  const displayValue = notTested
    ? "—"
    : (valueDisplay ??
      (value == null
        ? "—"
        : formatLabNumber(toDisplayNumber(value, scale), {
            maximumFractionDigits: scale.factor > 1 ? 2 : 2,
          })));
  const rangeAvailable =
    !notTested && range?.sourced === true && range.bands.length > 0;
  const showAction =
    !notTested &&
    (Boolean(recommendedAction) ||
      status === "fair" ||
      status === "attention");
  const interactive = Boolean(onSelect) && !notTested;

  return (
    <article
      className={`group relative z-0 flex w-full overflow-visible rounded-2xl border px-5 py-4 text-left transition duration-200 ease-out ${
        notTested && suggestedTest
          ? "border-dashed border-status-attention/50 bg-status-attention/5 text-muted shadow-none"
          : notTested
            ? "border-dashed border-border/80 bg-surface-muted/40 text-muted shadow-none"
            : interactive
              ? "border-border bg-surface shadow-sm hover:z-10 hover:-translate-y-0.5 hover:border-accent hover:bg-accent-soft/40 hover:shadow-lg hover:shadow-accent/10"
              : "border-border bg-surface shadow-sm"
      }`}
    >
      {interactive ? (
        <button
          type="button"
          className="absolute inset-0 z-[1] rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label={`Open details for ${name}`}
          onClick={() => onSelect?.(biomarker)}
        />
      ) : null}

      <div className="relative z-[2] flex min-h-[5.5rem] w-full items-stretch gap-5 pointer-events-none">
        <div className="flex min-w-0 flex-1 flex-col">
          <h3
            className={`text-[13px] font-semibold leading-snug tracking-tight ${
              notTested
                ? "text-muted"
                : interactive
                  ? "text-foreground transition group-hover:text-accent"
                  : "text-foreground"
            }`}
          >
            {name}
          </h3>
          {subtitle ? (
            <p className="mt-0.5 text-[12px] italic leading-snug text-muted">
              {subtitle}
            </p>
          ) : null}

          <div className="mt-auto flex flex-col gap-2 pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {notTested ? (
                suggestedTest ? (
                  <span className="inline-flex items-center rounded-full border border-status-attention/40 bg-status-attention/10 px-2 py-0.5 text-[11px] font-medium text-status-attention">
                    Worth asking about
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-border bg-surface/60 px-2 py-0.5 text-[11px] font-medium text-muted">
                    Not tested
                  </span>
                )
              ) : (
                <>
                  <LabBadge status={labStatus} />
                  <GradeBadge status={rangeAvailable ? status : null} />
                </>
              )}
            </div>

            {showAction ? (
              <p className="flex items-center gap-1.5 text-[11px] text-muted">
                <ActionIcon />
                {recommendedAction ?? "Action available"}
              </p>
            ) : null}

            {notTested && suggestedTest ? (
              <p className="text-[11px] leading-snug text-muted">
                {suggestedTestReason ??
                  "Often discussed with markers that need attention on this report."}
              </p>
            ) : !notTested && !rangeAvailable ? (
              <p className="text-[11px] leading-snug text-muted">
                Range not available — see data sources.
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {rangeAvailable ? (
            <RangeBar
              bands={range.bands}
              value={value}
              orientation="vertical"
              label={name}
              size={76}
              thickness={3}
            />
          ) : notTested ? null : (
            <span className="w-3" aria-hidden />
          )}
          <div className="min-w-[3.25rem] text-right">
            <p
              className={`text-[1.625rem] font-medium leading-none tracking-tight tabular-nums ${
                notTested ? "text-muted/70" : "text-foreground"
              }`}
            >
              {displayValue}
            </p>
            <p className="mt-1 text-[11px] text-muted">{displayUnit}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function ActionIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M8 7h8M8 12h8M8 17h5" />
      <rect x="4" y="3" width="16" height="18" rx="2" />
    </svg>
  );
}
