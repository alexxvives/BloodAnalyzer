import { describe, expect, it } from "vitest";
import { csvExtractor, parseLabValue } from "./csv-extractor";

describe("parseLabValue", () => {
  it("parses plain and inequality values", () => {
    expect(parseLabValue("67.6")).toEqual({ value: 67.6 });
    expect(parseLabValue("<6.2")).toEqual({
      value: 6.2,
      valueDisplay: "<6.2",
    });
  });
});

describe("csvExtractor", () => {
  it("maps known marker names to ids", async () => {
    const csv = [
      "name,value,unit",
      "LDL Cholesterol,67.6,mg/dL",
      "HDL,56,mg/dL",
      "Mystery Marker,1,u",
    ].join("\n");

    const result = await csvExtractor.extract(
      new Blob([csv], { type: "text/csv" }),
      { name: "labs.csv", type: "text/csv" },
    );

    expect(result.method).toBe("csv");
    expect(result.markers[0].biomarkerId).toBe("ldl-cholesterol");
    expect(result.markers[1].biomarkerId).toBe("hdl-cholesterol");
    expect(result.markers[2].biomarkerId).toBeNull();
    expect(result.warnings.some((w) => w.includes("Mystery Marker"))).toBe(
      true,
    );
  });

  it("parses EasyDraw name/unit/value exports without a name,value header", async () => {
    const csv = [
      ",,21-Jul-26",
      `"Exported: Aug 9, 2026",Unit,EasyDraw Ultimate Health Test`,
      "Heart Health,,",
      "Apolipoprotein B (APOB),mg/dL,50",
      "Lipoprotein (a),mg/dL,<6.2",
      `"Cholesterol, Total",mg/dL,134`,
      "HDL Cholesterol,mg/dL,56",
      "LDL Cholesterol,mg/dL,67.6",
      "Metabolic Health,,",
      "% Hemoglobin A1C,%,5.4",
      "High-Sensitivity CRP,mg/L,<0.2",
      "Morning Cortisol,ug/dL,20.2",
      `"Testosterone, Total (Males)",ng/dL,604.26`,
      "25-(OH) Vitamin D,ng/mL,29.8",
      "Ferritin,ng/mL,245",
      "Nutritional,,",
      "Total Cholesterol:HDL Ratio,,2.4",
      "LDL-C:ApoB Ratio,,1.35",
    ].join("\n");

    const result = await csvExtractor.extract(
      new Blob([csv], { type: "text/csv" }),
      { name: "results.csv", type: "text/csv" },
    );

    expect(result.method).toBe("csv");
    expect(result.warnings.some((w) => w.includes("name/biomarker"))).toBe(
      false,
    );

    const byId = Object.fromEntries(
      result.markers
        .filter((m) => m.biomarkerId)
        .map((m) => [m.biomarkerId, m]),
    );

    expect(byId["apo-b"]?.value).toBe(50);
    expect(byId["lp-a"]?.valueDisplay).toBe("<6.2");
    expect(byId["total-cholesterol"]?.value).toBe(134);
    expect(byId["hdl-cholesterol"]?.unit).toBe("mg/dL");
    expect(byId["ldl-cholesterol"]?.value).toBe(67.6);
    expect(byId.hba1c?.value).toBe(5.4);
    expect(byId.crp?.valueDisplay).toBe("<0.2");
    expect(byId.cortisol?.value).toBe(20.2);
    expect(byId.testosterone?.value).toBe(604.26);
    expect(byId["vitamin-d"]?.value).toBe(29.8);
    expect(byId.ferritin?.value).toBe(245);
    expect(byId["ldl-apo-b-ratio"]?.value).toBe(1.35);

    expect(result.markers.some((m) => m.name === "Heart Health")).toBe(false);
    expect(result.markers.some((m) => m.name.startsWith("Exported:"))).toBe(
      false,
    );
  });
});
