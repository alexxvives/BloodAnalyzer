"use client";

import { useId } from "react";
import {
  resolveBandsForDisplay,
  valueToVerticalRatio,
} from "@/lib/scoring/range-geometry";
import { STATUS_CSS_VAR } from "@/lib/status-tokens";
import type { ReferenceRangeBand } from "@/lib/types";

export type RangeBarProps = {
  bands: ReferenceRangeBand[];
  value: number | null;
  orientation?: "vertical" | "horizontal";
  /** Accessible label, e.g. biomarker name */
  label: string;
  className?: string;
  /** Vertical height or horizontal width basis in px */
  size?: number;
  /** Vertical bar thickness in px — keep thin on cards */
  thickness?: number;
};

/**
 * Shared position-in-range gauge. Vertical for cards; horizontal for detail panels.
 * Segment colors come from status design tokens only.
 */
export function RangeBar({
  bands,
  value,
  orientation = "vertical",
  label,
  className = "",
  size = 72,
  thickness = 4,
}: RangeBarProps) {
  const clipId = useId();

  if (!bands.length) {
    return (
      <div
        className={`flex items-center justify-center text-xs text-muted ${className}`}
        role="img"
        aria-label={`${label}: range not available`}
      >
        —
      </div>
    );
  }

  const { bands: resolved, spanMin, spanMax } = resolveBandsForDisplay(
    bands,
    value,
  );
  const markerRatio =
    value == null ? null : valueToVerticalRatio(value, spanMin, spanMax);

  if (orientation === "horizontal") {
    return (
      <HorizontalRangeBar
        bands={resolved}
        spanMin={spanMin}
        spanMax={spanMax}
        markerRatio={markerRatio}
        label={label}
        className={className}
        width={size * 4}
        clipId={clipId}
      />
    );
  }

  return (
    <VerticalRangeBar
      bands={resolved}
      spanMin={spanMin}
      spanMax={spanMax}
      markerRatio={markerRatio}
      label={label}
      className={className}
      height={size}
      thickness={thickness}
      clipId={clipId}
    />
  );
}

type InnerProps = {
  bands: ReturnType<typeof resolveBandsForDisplay>["bands"];
  spanMin: number;
  spanMax: number;
  markerRatio: number | null;
  label: string;
  className: string;
  clipId: string;
};

function VerticalRangeBar({
  bands,
  spanMin,
  spanMax,
  markerRatio,
  label,
  className,
  height,
  thickness,
  clipId,
}: InnerProps & { height: number; thickness: number }) {
  const barWidth = thickness;
  const markerR = 4;
  const padX = markerR + 1;
  const svgWidth = padX * 2 + barWidth;
  const span = spanMax - spanMin;

  return (
    <svg
      width={svgWidth}
      height={height}
      viewBox={`0 0 ${svgWidth} ${height}`}
      className={className}
      role="img"
      aria-label={
        markerRatio == null
          ? `${label}: value not available`
          : `${label}: position in reference range`
      }
    >
      <defs>
        <clipPath id={clipId}>
          <rect
            x={padX}
            y={0}
            width={barWidth}
            height={height}
            rx={barWidth / 2}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {bands.map((band) => {
          const yTop = height - ((band.max - spanMin) / span) * height;
          const yBottom = height - ((band.min - spanMin) / span) * height;
          return (
            <rect
              key={`${band.status}-${band.min}-${band.max}`}
              x={padX}
              y={yTop}
              width={barWidth}
              height={Math.max(yBottom - yTop, 0.5)}
              fill={STATUS_CSS_VAR[band.status]}
            />
          );
        })}
      </g>
      {markerRatio != null && (
        <circle
          cx={padX + barWidth / 2}
          cy={height - markerRatio * height}
          r={markerR}
          fill="white"
          stroke="var(--foreground)"
          strokeWidth={1.25}
        />
      )}
    </svg>
  );
}

function HorizontalRangeBar({
  bands,
  spanMin,
  spanMax,
  markerRatio,
  label,
  className,
  width,
  clipId,
}: InnerProps & { width: number }) {
  const height = 12;
  const span = spanMax - spanMin;

  return (
    <svg
      width={width}
      height={height + 10}
      viewBox={`0 0 ${width} ${height + 10}`}
      className={className}
      role="img"
      aria-label={
        markerRatio == null
          ? `${label}: value not available`
          : `${label}: position in reference range`
      }
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={5} width={width} height={height} rx={height / 2} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {bands.map((band) => {
          const x1 = ((band.min - spanMin) / span) * width;
          const x2 = ((band.max - spanMin) / span) * width;
          return (
            <rect
              key={`${band.status}-${band.min}-${band.max}`}
              x={x1}
              y={5}
              width={Math.max(x2 - x1, 0.5)}
              height={height}
              fill={STATUS_CSS_VAR[band.status]}
            />
          );
        })}
      </g>
      {markerRatio != null && (
        <circle
          cx={markerRatio * width}
          cy={5 + height / 2}
          r={6}
          fill="white"
          stroke="var(--in-range)"
          strokeWidth={2}
        />
      )}
    </svg>
  );
}
