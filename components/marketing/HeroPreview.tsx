"use client";

import { RangeBar } from "@/components/ui/RangeBar";
import { GradeBadge, LabBadge } from "@/components/ui/StatusBadge";
import { compareToPopulation, scoreBiomarker } from "@/lib/scoring";
import { STATUS_CSS_VAR, STATUS_LABEL } from "@/lib/status-tokens";
import type { Demographic } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

/**
 * Illustrative results for a fictional sample person. Values are labelled as a
 * sample in the UI; every band, unit and grade around them is resolved live
 * from the sourced reference-range data layer, never written here.
 */
const SAMPLE_VALUES: Array<{ biomarkerId: string; value: number }> = [
  { biomarkerId: "hdl-cholesterol", value: 68 },
  { biomarkerId: "hba1c", value: 5.9 },
  { biomarkerId: "vitamin-d", value: 24 },
  { biomarkerId: "triglycerides", value: 82 },
  { biomarkerId: "ferritin", value: 210 },
];

const SAMPLE_DEMOGRAPHIC: Demographic = { sex: "male", ageYears: 34 };
const ROTATE_MS = 3600;

export function HeroPreview() {
  const slides = useMemo(
    () =>
      SAMPLE_VALUES.map(({ biomarkerId, value }) => {
        const scored = scoreBiomarker({
          biomarkerId,
          value,
          demographic: SAMPLE_DEMOGRAPHIC,
        });
        const population = compareToPopulation({
          biomarkerId,
          value,
          demographic: SAMPLE_DEMOGRAPHIC,
        });
        return { biomarkerId, value, scored, population };
      }).filter((s) => s.scored.rangeAvailable && s.scored.range),
    [],
  );

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;
    const t = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      ROTATE_MS,
    );
    return () => clearInterval(t);
  }, [paused, slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[index]!;
  const range = slide.scored.range!;
  const status = slide.scored.status;

  return (
    <div
      className="relative w-full min-w-0 max-w-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,var(--accent-soft),transparent_70%)]"
      />

      <div className="rounded-3xl border border-border bg-surface p-5 shadow-[0_24px_60px_-32px_rgba(26,34,38,0.5)]">
        <div className="flex items-center justify-between">
          <p className="ba-eyebrow">Sample report card</p>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
            Sample data
          </span>
        </div>

        <div key={slide.biomarkerId} className="animate-[fadeUp_0.45s_ease-out_both]">
          <div className="mt-4 flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {range.name ?? slide.biomarkerId}
              </p>
              {range.subtitle ? (
                <p className="truncate text-xs italic text-muted">
                  {range.subtitle}
                </p>
              ) : null}
              <p className="mt-3 text-4xl font-medium leading-none tracking-tight tabular-nums">
                {slide.value}
                <span className="ml-1.5 text-base font-normal text-muted">
                  {range.unit}
                </span>
              </p>
              {status ? (
                <p
                  className="mt-2 text-sm font-medium"
                  style={{ color: STATUS_CSS_VAR[status] }}
                >
                  {STATUS_LABEL[status]}
                </p>
              ) : null}
            </div>

            <RangeBar
              bands={range.bands}
              value={slide.value}
              label={range.name ?? slide.biomarkerId}
              size={112}
              thickness={3}
              className="shrink-0"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <LabBadge status={slide.scored.labStatus} />
            <GradeBadge status={status} />
          </div>

          <div className="mt-4 rounded-xl bg-surface-muted/60 px-3.5 py-3">
            <p className="ba-eyebrow">Vs. men aged 34</p>
            {slide.population.available &&
            slide.population.percentDelta != null ? (
              <>
                <p className="mt-1.5 text-sm text-foreground">
                  <span className="font-medium tabular-nums">
                    {slide.population.percentDelta > 0 ? "+" : "−"}
                    {Math.abs(slide.population.percentDelta).toFixed(0)}%
                  </span>{" "}
                  vs. the population {slide.population.benchmarkLabel} of{" "}
                  <span className="tabular-nums">
                    {slide.population.benchmarkValue?.toLocaleString()}
                  </span>{" "}
                  {range.unit}
                </p>
                <p className="mt-1 truncate text-[11px] text-muted">
                  {slide.population.dataset}
                </p>
              </>
            ) : (
              <p className="mt-1.5 text-sm text-muted">
                Benchmark data not yet available for this marker.
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex min-w-0 items-center gap-1.5 border-t border-border pt-4">
          {slides.map((s, i) => (
            <button
              key={s.biomarkerId}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${s.scored.range?.name ?? s.biomarkerId}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-6 bg-accent"
                  : "w-1.5 bg-border hover:bg-muted"
              }`}
            />
          ))}
          <span className="ml-auto min-w-0 truncate text-[11px] text-muted">
            Graded against sourced ranges
          </span>
        </div>
      </div>
    </div>
  );
}
