import { describe, expect, it } from "vitest";
import {
  chunkLabText,
  chunkText,
  normalizeAiMarkers,
  packChunks,
  prepareTextForModel,
} from "./ai-lab-extractor";

describe("ai-lab-extractor helpers", () => {
  it("redacts emails/phones but keeps assay lines", () => {
    const out = prepareTextForModel(
      "Patient: a@b.com\nCall 555-123-4567\nLDL Cholesterol 120 mg/dL",
    );
    expect(out).toMatch(/\[redacted-email\]/);
    expect(out).toMatch(/\[redacted-phone\]/);
    expect(out).toMatch(/LDL Cholesterol 120 mg\/dL/);
  });

  it("chunks long text with overlap", () => {
    const text = "A\n".repeat(8000);
    const chunks = chunkText(text, 1000);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length > 0)).toBe(true);
  });

  it("splits EasyDraw-style health sections", () => {
    const text = `Header
Heart Health
LDL Cholesterol (mg/dL) optimal: 40 - 90
67.6
Kidney Health
Creatinine (mg/dL) optimal: 0.75 - 1.05
0.77
Insights
Ignore this advice paragraph.`;
    const prepared = prepareTextForModel(text);
    expect(prepared).not.toMatch(/Ignore this advice/);
    expect(prepared).not.toMatch(/\boptimal\s*:/i);
    expect(prepared).toMatch(/LDL Cholesterol \(mg\/dL\)/);
    expect(prepared).toMatch(/67\.6/);
    const chunks = chunkLabText(prepared, 4500);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks.some((c) => /Heart Health/i.test(c))).toBe(true);
    expect(chunks.some((c) => /Kidney Health/i.test(c))).toBe(true);
  });

  it("strips range-band noise but keeps measured values for the model", () => {
    const prepared = prepareTextForModel(`
Apolipoprotein B (APOB) (mg/dL) optimal: 40 - 70
good: 40 - 90
fair: 20 - 110
50
Lipoprotein (a) (mg/dL) good: 0 - 30
<6.2
`);
    expect(prepared).not.toMatch(/\b(optimal|good|fair)\s*:/i);
    expect(prepared).toContain("Apolipoprotein B (APOB) (mg/dL)");
    expect(prepared).toMatch(/^50$/m);
    expect(prepared).toContain("<6.2");
  });

  it("normalizes AI JSON into mapped markers and keeps inequalities", () => {
    const markers = normalizeAiMarkers({
      markers: [
        {
          name: "LDL Cholesterol",
          value: 67.6,
          unit: "mg/dL",
          biomarkerId: "ldl-cholesterol",
        },
        {
          name: "Lipoprotein (a)",
          value: 6.2,
          valueDisplay: "<6.2",
          unit: "mg/dL",
          biomarkerId: "lp-a",
        },
        {
          name: "Mystery Assay",
          value: 12,
          unit: "ng/mL",
          biomarkerId: null,
        },
        {
          name: "",
          value: 1,
          unit: "x",
        },
      ],
    });

    expect(markers).toHaveLength(3);
    expect(markers[0]?.biomarkerId).toBe("ldl-cholesterol");
    expect(markers[1]?.valueDisplay).toBe("<6.2");
    expect(markers[2]?.biomarkerId).toBeNull();
  });

  it("remaps unknown model ids via name aliases", () => {
    const markers = normalizeAiMarkers({
      markers: [
        {
          name: "Blood Urea Nitrogen (BUN)",
          value: 16,
          unit: "mg/dL",
          biomarkerId: "not-a-real-id",
        },
      ],
    });
    expect(markers[0]?.biomarkerId).toBe("urea");
  });

  it("packs tiny sections without exceeding the char budget", () => {
    const packed = packChunks(["Heart\n67", "Kidney\n0.8", "A".repeat(400)], 200);
    expect(packed.length).toBeGreaterThanOrEqual(2);
    expect(packed.every((c) => c.length <= 400)).toBe(true);
    expect(packed.some((c) => c.includes("Heart") && c.includes("Kidney"))).toBe(
      true,
    );
  });
});
