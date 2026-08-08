"use client";

import type { BiomarkerStatus } from "@/lib/types";
import { STATUS_CSS_VAR } from "@/lib/status-tokens";

type SectionScoreRingProps = {
  percent: number;
  /** Color status for the ring arc */
  status?: BiomarkerStatus | "in_range";
  label?: string;
  size?: number;
  /** Caption under the % (e.g. IN RANGE) */
  caption?: string;
};

/**
 * Circular % gauge for section summaries (SiPhox-style ring with center %).
 */
export function SectionScoreRing({
  percent,
  status = "good",
  label = "optimization score",
  size = 72,
  caption,
}: SectionScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const stroke = Math.max(10, Math.round(size * 0.12));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  const color =
    status === "in_range" ? "var(--in-range)" : STATUS_CSS_VAR[status];
  const valueSize = Math.round(size * 0.26);
  const pctSize = Math.round(size * 0.1);
  const captionSize = Math.max(10, Math.round(size * 0.09));

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${clamped}% ${label}${caption ? `, ${caption}` : ""}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
        <span
          className="font-[family-name:var(--font-fraunces)] leading-none tracking-tight text-foreground"
          style={{ fontSize: valueSize }}
        >
          {clamped}
          <span
            className="ml-0.5 font-sans font-medium text-muted"
            style={{ fontSize: pctSize }}
          >
            %
          </span>
        </span>
        {caption ? (
          <span
            className="mt-1 font-semibold uppercase tracking-[0.08em]"
            style={{ fontSize: captionSize, color }}
          >
            {caption}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Map section % → ring color token */
export function sectionPercentStatus(
  percent: number,
): BiomarkerStatus | "in_range" {
  if (percent >= 90) return "optimal";
  if (percent >= 75) return "good";
  if (percent >= 50) return "fair";
  return "attention";
}
