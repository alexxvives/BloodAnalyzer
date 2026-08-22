import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { extractMarkersFromBandStyleText } from "./band-style-extractor";

describe("extractMarkersFromBandStyleText", () => {
  it("parses EasyDraw / band-style layout from fixture text", () => {
    const text = `
Heart Health
Apolipoprotein B (APOB) (mg/dL) optimal: 40 - 70
good: 40 - 90
fair: 20 - 110
50
Lipoprotein (a) (mg/dL) good: 0 - 30
fair: 0 - 50
<6.2
LDL Cholesterol (mg/dL) optimal: 40 - 90
good: 40 - 120
fair: 40 - 130
67.6
High-Sensitivity CRP (mg/L) optimal: 0 - 1 <0.2
Creatinine (mg/dL) optimal: 0.75 - 1.05
good: 0.7 - 1.15
fair: 0.7 - 1.3
0.77
`;
    const result = extractMarkersFromBandStyleText(text);
    const byId = Object.fromEntries(
      result.markers
        .filter((m) => m.biomarkerId)
        .map((m) => [m.biomarkerId, m]),
    );

    expect(byId["apo-b"]?.value).toBe(50);
    expect(byId["lp-a"]?.valueDisplay ?? String(byId["lp-a"]?.value)).toMatch(
      /6\.2/,
    );
    expect(byId["ldl-cholesterol"]?.value).toBe(67.6);
    expect(byId.crp?.valueDisplay ?? String(byId.crp?.value)).toMatch(/0\.2/);
    expect(byId.creatinine?.value).toBe(0.77);
  });

  it("extracts many markers from results.pdf text dump when present", () => {
    let text = "";
    try {
      text = readFileSync(".firecrawl/results-raw.txt", "utf8");
    } catch {
      return; // optional local artifact
    }
    if (!text) return;

    const result = extractMarkersFromBandStyleText(text);
    expect(result.markers.length).toBeGreaterThanOrEqual(25);
    const ids = new Set(result.markers.map((m) => m.biomarkerId).filter(Boolean));
    expect(ids.has("ldl-cholesterol")).toBe(true);
    expect(ids.has("hba1c")).toBe(true);
    expect(ids.has("ferritin")).toBe(true);
    expect(ids.has("creatinine")).toBe(true);
  });
});
