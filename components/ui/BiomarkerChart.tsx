"use client";

/**
 * Single charting entrypoint for the app.
 * - Range gauges: SVG via <RangeBar> (segmented clinical scale)
 * - Population small multiples: Recharts via <PopulationComparisonView>
 * - Progress timelines: Recharts via <BiomarkerTrendChart>
 */
export { RangeBar } from "./RangeBar";
export type { RangeBarProps } from "./RangeBar";
export { PopulationComparisonView } from "./PopulationComparison";
export { BiomarkerTrendChart } from "./BiomarkerTrendChart";

