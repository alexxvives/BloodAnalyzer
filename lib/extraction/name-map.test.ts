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
  it("does not treat % Free Testosterone as Free Testosterone", () => {
    expect(resolveBiomarkerId("% Free Testosterone")).toBeNull();
    expect(resolveBiomarkerId("% Hemoglobin A1C")).toBe("hba1c");
  });

  it("does not map VLDL cholesterol or UIBC to a different analyte", () => {
    expect(resolveBiomarkerId("VLDL Cholesterol (Calc)")).toBeNull();
    expect(
      resolveBiomarkerId("Unsaturated iron-binding capacity test (UIBC)"),
    ).toBeNull();
    expect(resolveBiomarkerId("Iron")).toBe("serum-iron");
    expect(resolveBiomarkerId("Cholesterol, Total")).toBe("total-cholesterol");
  });
});
