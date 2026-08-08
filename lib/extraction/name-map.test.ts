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
