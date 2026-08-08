"use client";

import { InfoPopover } from "@/components/ui/InfoPopover";
import {
  formatLabNumber,
  labDisplayScale,
  sampleMagnitudeForScale,
  toDisplayNumber,
} from "@/lib/report/format-lab-number";
import type { PopulationComparison as Comparison } from "@/lib/scoring/population";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type PopulationComparisonProps = {
  comparison: Comparison;
  unit: string;
  value: number | null;
  compact?: boolean;
};

/**
 * Demographic population comparison — Recharts for the small multiple.
 * Missing benchmarks show the AGENTS empty copy (never invent a number).
 */
export function PopulationComparisonView({
  comparison,
  unit,
  value,
  compact = false,
}: PopulationComparisonProps) {
  if (!comparison.available) {
    if (compact) return null;
    return (
      <p className="text-xs text-muted">benchmark data not yet available</p>
    );
  }

  const scale = labDisplayScale(
    unit,
    sampleMagnitudeForScale({
      value,
      labHigh: comparison.benchmarkValue,
    }),
  );
  const you = value == null ? 0 : toDisplayNumber(value, scale);
  const avg =
    comparison.benchmarkValue == null
      ? 0
      : toDisplayNumber(comparison.benchmarkValue, scale);

  const chartData = [
    {
      name: "You",
      value: you,
      fill: "var(--accent)",
    },
    {
      name: "Avg",
      value: avg,
      fill: "var(--muted)",
    },
  ];

  if (compact) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium text-muted">
          vs {comparison.benchmarkLabel ?? "population"}
          {comparison.dataset ? ` · ${comparison.dataset}` : ""}
        </p>
        {comparison.sourceRefs.length > 0 || comparison.dataset ? (
          <InfoPopover label="Population benchmark sources">
            {comparison.dataset ? (
              <p className="mb-2 text-muted">Dataset: {comparison.dataset}</p>
            ) : null}
            {comparison.sourceRefs.length > 0 ? (
              <ul className="space-y-2">
                {comparison.sourceRefs.map((ref) => (
                  <li key={ref.label}>
                    <span className="font-medium text-foreground">
                      {ref.label}
                    </span>
                    {ref.citation ? (
                      <span className="text-muted"> — {ref.citation}</span>
                    ) : null}
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
            ) : (
              <p className="text-muted">
                See data/SOURCES.md for population benchmark citations.
              </p>
            )}
          </InfoPopover>
        ) : null}
      </div>

      {unit && comparison.benchmarkValue != null ? (
        <span className="sr-only">
          Benchmark {comparison.benchmarkLabel}:{" "}
          {formatLabNumber(avg)} {scale.unit}
        </span>
      ) : null}

      <div className="h-28 w-full max-w-xs">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="30%">
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={[0, "auto"]} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
