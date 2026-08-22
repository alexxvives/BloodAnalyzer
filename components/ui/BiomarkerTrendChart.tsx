"use client";

import {
  formatLabNumber,
  labDisplayScale,
  sampleMagnitudeForScale,
  toDisplayNumber,
} from "@/lib/report/format-lab-number";
import type { BiomarkerTrendSeries } from "@/lib/report/biomarker-trends";
import { resolveBandsForDisplay } from "@/lib/scoring/range-geometry";
import { STATUS_CSS_VAR } from "@/lib/status-tokens";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type BiomarkerTrendChartProps = {
  series: BiomarkerTrendSeries;
  height?: number;
};

/** Soft fills for optimization zones behind the timeline. */
const ZONE_FILL: Record<string, string> = {
  optimal: "color-mix(in srgb, var(--status-optimal) 16%, transparent)",
  good: "color-mix(in srgb, var(--status-good) 14%, transparent)",
  fair: "color-mix(in srgb, var(--status-fair) 14%, transparent)",
  attention: "color-mix(in srgb, var(--status-attention) 14%, transparent)",
};

/** Recharts timeline for one biomarker — always drawn, even with a single point. */
export function BiomarkerTrendChart({
  series,
  height = 120,
}: BiomarkerTrendChartProps) {
  const latestValue = series.points[series.points.length - 1]?.value;
  const scale = labDisplayScale(
    series.unit,
    sampleMagnitudeForScale({ value: latestValue }),
  );

  const data = series.points.map((p) => ({
    at: p.at,
    label: formatShortDate(p.at),
    value: toDisplayNumber(p.value, scale),
    status: p.status,
    reportId: p.reportId,
  }));

  if (data.length === 0) {
    return <p className="text-xs text-muted">No values yet for {series.name}.</p>;
  }

  const stroke =
    series.points[series.points.length - 1]?.status != null
      ? STATUS_CSS_VAR[series.points[series.points.length - 1]!.status!]
      : "var(--accent)";

  const values = data.map((d) => d.value).filter((v): v is number => v != null);
  const dataMin = values.length ? Math.min(...values) : 0;
  const dataMax = values.length ? Math.max(...values) : 1;
  const dataPad = Math.max(
    (dataMax - dataMin) * 0.15,
    Math.abs(dataMax || 1) * 0.05,
    0.5,
  );

  const zoneAreas =
    series.zones && series.zones.length > 0
      ? (() => {
          const resolved = resolveBandsForDisplay(
            series.zones,
            latestValue ?? null,
          );
          return {
            bands: resolved.bands.map((b) => ({
              status: b.status,
              min: toDisplayNumber(b.min, scale),
              max: toDisplayNumber(b.max, scale),
            })),
            spanMin: toDisplayNumber(resolved.spanMin, scale),
            spanMax: toDisplayNumber(resolved.spanMax, scale),
          };
        })()
      : null;

  let domainMin = dataMin - dataPad;
  let domainMax = dataMax + dataPad;
  if (zoneAreas) {
    domainMin = Math.min(domainMin, zoneAreas.spanMin);
    domainMax = Math.max(domainMax, zoneAreas.spanMax);
  }
  if (domainMin === domainMax) {
    domainMin -= 1;
    domainMax += 1;
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--muted)" }}
            axisLine={false}
            tickLine={false}
            padding={data.length === 1 ? { left: 24, right: 24 } : undefined}
          />
          <YAxis
            width={36}
            domain={[domainMin, domainMax]}
            tick={{ fontSize: 10, fill: "var(--muted)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatLabNumber(v)}
          />
          {zoneAreas?.bands.map((band, i) => (
            <ReferenceArea
              key={`${band.status}-${i}`}
              y1={band.min}
              y2={band.max}
              fill={ZONE_FILL[band.status] ?? "transparent"}
              fillOpacity={1}
              strokeOpacity={0}
              ifOverflow="hidden"
            />
          ))}
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(value) => [
              `${formatLabNumber(Number(value))} ${scale.unit}`,
              series.name,
            ]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2}
            dot={{ r: data.length === 1 ? 5 : 3.5, fill: stroke, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
