"use client";

import { useId } from "react";
import {
  formatLabNumber,
  formatLabTick,
  labDisplayScale,
  sampleMagnitudeForScale,
  toDisplayNumber,
} from "@/lib/report/format-lab-number";
import {
  resolveBandsForDisplay,
  valueToVerticalRatio,
} from "@/lib/scoring/range-geometry";
import { STATUS_CSS_VAR } from "@/lib/status-tokens";
import type { BiomarkerStatus, ReferenceRangeBand } from "@/lib/types";

type DetailRangeChartProps = {
  name: string;
  unit: string;
  value: number | null;
  valueDisplay?: string;
  bands: ReferenceRangeBand[];
  labLow?: number | null;
  labHigh?: number | null;
};

/**
 * Detail-panel range chart: vertical gauge with tick labels and a plotted point.
 */
export function DetailRangeChart({
  name,
  unit,
  value,
  valueDisplay,
  bands,
  labLow,
  labHigh,
}: DetailRangeChartProps) {
  const clipId = useId();
  const scale = labDisplayScale(
    unit,
    sampleMagnitudeForScale({
      value,
      labLow,
      labHigh,
      bandEdges: bands.flatMap((b) => [b.min, b.max]),
    }),
  );
  const displayUnit = scale.unit;
  const displayValue =
    valueDisplay ??
    (value == null
      ? "—"
      : formatLabNumber(toDisplayNumber(value, scale), {
          maximumFractionDigits: scale.factor > 1 ? 2 : 2,
        }));

  if (!bands.length) {
    return (
      <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-2xl font-medium tracking-tight tabular-nums">
            {displayValue}
            <span className="ml-1.5 text-sm text-muted">{displayUnit}</span>
          </p>
        </div>
        <p className="mt-6 text-sm text-muted">Range not available.</p>
      </div>
    );
  }

  const { bands: resolved, spanMin, spanMax } = resolveBandsForDisplay(
    bands,
    value,
  );
  const markerRatio =
    value == null ? null : valueToVerticalRatio(value, spanMin, spanMax);
  const markerStatus =
    value == null ? null : bandStatusAtValue(resolved, value);
  const ticks = uniqueTicks(resolved, spanMin, spanMax);
  const padY = 14;
  const chartHeight = 220;
  const innerHeight = chartHeight - padY * 2;
  const barWidth = 6;
  const labelWidth = scale.factor > 1 ? 56 : 52;
  const rightPad = 12;
  const plotPad = 200;
  const svgWidth = labelWidth + barWidth + plotPad + rightPad;
  const span = spanMax - spanMin;
  const lineEndX = svgWidth - rightPad;

  const yFor = (v: number) =>
    padY + innerHeight - ((v - spanMin) / span) * innerHeight;

  return (
    <div className="rounded-2xl border border-border bg-surface-muted/30 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium text-foreground">
          {name}
        </p>
        <p className="shrink-0 text-2xl font-medium tracking-tight tabular-nums">
          {displayValue}
          <span className="ml-1.5 text-sm font-sans text-muted">
            {displayUnit}
          </span>
        </p>
      </div>

      <div className="mt-4 w-full overflow-x-auto">
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${svgWidth} ${chartHeight}`}
          preserveAspectRatio="xMinYMid meet"
          role="img"
          aria-label={`${name}: ${displayValue} ${displayUnit} in reference range`}
          className="block w-full"
        >
          <defs>
            <clipPath id={clipId}>
              <rect
                x={labelWidth}
                y={padY}
                width={barWidth}
                height={innerHeight}
                rx={barWidth / 2}
              />
            </clipPath>
          </defs>

          {ticks.map((tick) => {
            const y = yFor(tick);
            return (
              <g key={tick}>
                <text
                  x={labelWidth - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[var(--muted)]"
                  fontSize={11}
                >
                  {formatLabTick(toDisplayNumber(tick, scale))}
                </text>
                <line
                  x1={labelWidth + barWidth + 8}
                  x2={lineEndX}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="3 4"
                />
              </g>
            );
          })}

          <g clipPath={`url(#${clipId})`}>
            {resolved.map((band) => {
              const yTop = yFor(band.max);
              const yBottom = yFor(band.min);
              return (
                <rect
                  key={`${band.status}-${band.min}-${band.max}`}
                  x={labelWidth}
                  y={yTop}
                  width={barWidth}
                  height={Math.max(yBottom - yTop, 0.5)}
                  fill={STATUS_CSS_VAR[band.status]}
                />
              );
            })}
          </g>

          {markerRatio != null ? (
            <circle
              cx={labelWidth + barWidth + 28}
              cy={padY + innerHeight - markerRatio * innerHeight}
              r={6}
              fill="var(--surface)"
              stroke={
                markerStatus
                  ? STATUS_CSS_VAR[markerStatus]
                  : "var(--status-optimal)"
              }
              strokeWidth={2.5}
            />
          ) : null}
        </svg>
      </div>
    </div>
  );
}

function bandStatusAtValue(
  bands: Array<{ status: BiomarkerStatus; min: number; max: number }>,
  value: number,
): BiomarkerStatus | null {
  for (const band of bands) {
    if (value >= band.min && value <= band.max) return band.status;
  }
  return bands[0]?.status ?? null;
}

function uniqueTicks(
  bands: Array<{ min: number; max: number }>,
  spanMin: number,
  spanMax: number,
): number[] {
  const set = new Set<number>();
  for (const band of bands) {
    set.add(band.min);
    set.add(band.max);
  }
  set.add(spanMin);
  set.add(spanMax);
  return [...set]
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => b - a)
    .filter((n, i, arr) => {
      if (i === 0 || i === arr.length - 1) return true;
      const prev = arr[i - 1];
      const span = spanMax - spanMin || 1;
      return Math.abs(prev - n) / span > 0.06;
    });
}
