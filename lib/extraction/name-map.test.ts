import { describe, expect, it } from "vitest";
import { normalizeMarkerKey, resolveBiomarkerId } from "./name-map";

describe("resolveBiomarkerId — corpuscular indices", () => {
  it("maps HCM / Hb Corpuscular Media to mch", () => {
    expect(resolveBiomarkerId("Hb Corpuscular Media (HCM)")).toBe("mch");
    expect(resolveBiomarkerId("HbCorpuscolar media")).toBe("mch");
  });

  it("maps CHCM / C. Hb Corpuscular Media to mchc (not mch)", () => {
    expect(normalizeMarkerKey("C. Hb Corpuscular Media (CHCM)")).toBe(
      "c hb corpuscular media chcm",
    );
    expect(resolveBiomarkerId("C. Hb Corpuscular Media (CHCM)")).toBe("mchc");
    expect(resolveBiomarkerId("C Hb Corpuscular media")).toBe("mchc");
  });
});

describe("resolveBiomarkerId — percent-of markers", () => {
  it("maps % Free Testosterone separately from Free Testosterone", () => {
    expect(resolveBiomarkerId("% Free Testosterone")).toBe(
      "percent-free-testosterone",
    );
    expect(resolveBiomarkerId("% Hemoglobin A1C")).toBe("hba1c");
  });

  it("maps VLDL and UIBC to their own ids, not cholesterol or iron", () => {
    expect(resolveBiomarkerId("VLDL Cholesterol (Calc)")).toBe(
      "vldl-cholesterol",
    );
    expect(
      resolveBiomarkerId("Unsaturated iron-binding capacity test (UIBC)"),
    ).toBe("uibc");
    expect(resolveBiomarkerId("Iron")).toBe("serum-iron");
    expect(resolveBiomarkerId("Cholesterol, Total")).toBe("total-cholesterol");
  });

  it("maps EasyDraw export names that were previously unmapped", () => {
    expect(resolveBiomarkerId("Apolipoprotein A1 (APOA1)")).toBe("apo-a1");
    expect(resolveBiomarkerId("Total Cholesterol:HDL Ratio")).toBe(
      "tc-hdl-ratio",
    );
    expect(resolveBiomarkerId("C-Peptide")).toBe("c-peptide");
    expect(resolveBiomarkerId("Direct Bilirubin")).toBe("bilirubin-direct");
    expect(resolveBiomarkerId("Thyroperoxidase Antibody (TPOAb)")).toBe("tpoab");
    expect(resolveBiomarkerId("Iron Saturation")).toBe("iron-saturation");
    expect(resolveBiomarkerId("Total Protein")).toBe("total-protein");
    expect(resolveBiomarkerId("Estim. Avg Glu (eAG)")).toBe("eag");
    expect(resolveBiomarkerId("Free Androgen Index (FAI)")).toBe("fai");
  });
});
