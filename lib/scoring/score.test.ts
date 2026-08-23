import { describe, expect, it } from "vitest";
import { statusFromBands, valueInBand } from "./bands";
import { labStatusFromBounds } from "./lab";
import { scoreBiomarker } from "./score";

describe("valueInBand", () => {
  it("treats null min/max as unbounded", () => {
    expect(valueInBand(10, { status: "good", min: null, max: 20 })).toBe(true);
    expect(valueInBand(25, { status: "good", min: null, max: 20 })).toBe(false);
    expect(valueInBand(100, { status: "attention", min: 50, max: null })).toBe(true);
  });
});

describe("statusFromBands", () => {
  const bands = [
    { status: "optimal" as const, min: null, max: 99.999 },
    { status: "good" as const, min: 100, max: 129.999 },
    { status: "fair" as const, min: 130, max: 159.999 },
    { status: "attention" as const, min: 160, max: null },
  ];

  it("maps values to the first matching band", () => {
    expect(statusFromBands(90, bands)).toBe("optimal");
    expect(statusFromBands(110, bands)).toBe("good");
    expect(statusFromBands(145, bands)).toBe("fair");
    expect(statusFromBands(200, bands)).toBe("attention");
  });
});

describe("labStatusFromBounds", () => {
  it("returns unknown when both bounds are null", () => {
    expect(labStatusFromBounds(50, null, null)).toBe("unknown");
  });

  it("flags below low and above high as out of range", () => {
    expect(labStatusFromBounds(60, 70, 99)).toBe("out_of_range");
    expect(labStatusFromBounds(110, 70, 99)).toBe("out_of_range");
    expect(labStatusFromBounds(85, 70, 99)).toBe("in_range");
  });

  it("supports one-sided lab bounds", () => {
    expect(labStatusFromBounds(95, null, 100)).toBe("in_range");
    expect(labStatusFromBounds(120, null, 100)).toBe("out_of_range");
    expect(labStatusFromBounds(45, 40, null)).toBe("in_range");
    expect(labStatusFromBounds(30, 40, null)).toBe("out_of_range");
  });
});

describe("scoreBiomarker", () => {
  it("scores LDL from the seeded data layer", () => {
    const result = scoreBiomarker({ biomarkerId: "ldl-cholesterol", value: 95 });
    expect(result.rangeAvailable).toBe(true);
    expect(result.status).toBe("optimal");
    expect(result.labStatus).toBe("in_range");
    expect(result.range?.unit).toBe("mg/dL");
    expect(result.sourceRefs.length).toBeGreaterThan(0);
  });

  it("scores fasting glucose across ADA-style bands", () => {
    expect(scoreBiomarker({ biomarkerId: "glucose-fasting", value: 85 }).status).toBe(
      "optimal",
    );
    expect(scoreBiomarker({ biomarkerId: "glucose-fasting", value: 110 }).status).toBe(
      "fair",
    );
    expect(scoreBiomarker({ biomarkerId: "glucose-fasting", value: 130 }).status).toBe(
      "attention",
    );
    expect(
      scoreBiomarker({ biomarkerId: "glucose-fasting", value: 110 }).labStatus,
    ).toBe("out_of_range");
  });

  it("uses sex-specific HDL lab flags but the sex-neutral ATP III grade", () => {
    // ATP III defines low HDL categorically as <40 mg/dL for both sexes, and its
    // Framingham HDL point strata are identical in the men's and women's tables.
    // The women's <50 figure comes from the separate metabolic syndrome criteria,
    // so it drives labStatus only.
    const male = scoreBiomarker({
      biomarkerId: "hdl-cholesterol",
      value: 45,
      demographic: { sex: "male", ageYears: 30 },
    });
    const female = scoreBiomarker({
      biomarkerId: "hdl-cholesterol",
      value: 45,
      demographic: { sex: "female", ageYears: 30 },
    });
    expect(male.status).toBe("fair");
    expect(male.labStatus).toBe("in_range");
    expect(female.status).toBe("fair");
    expect(female.labStatus).toBe("out_of_range");
  });

  it("uses sex-specific hemoglobin lab lows", () => {
    const male = scoreBiomarker({
      biomarkerId: "hemoglobin",
      value: 12.5,
      demographic: { sex: "male", ageYears: 40 },
    });
    const female = scoreBiomarker({
      biomarkerId: "hemoglobin",
      value: 12.5,
      demographic: { sex: "female", ageYears: 40 },
    });
    expect(male.labStatus).toBe("out_of_range");
    expect(female.labStatus).toBe("in_range");
  });

  it("caps hemoglobin at good — no invented optimal interior", () => {
    const mid = scoreBiomarker({
      biomarkerId: "hemoglobin",
      value: 15,
      demographic: { sex: "male", ageYears: 40 },
    });
    expect(mid.labStatus).toBe("in_range");
    expect(mid.status).toBe("good");
  });

  it("grades serum iron on Mayo endpoints only", () => {
    const inRange = scoreBiomarker({
      biomarkerId: "serum-iron",
      value: 90,
      demographic: { sex: "female", ageYears: 35 },
    });
    const belowMayo = scoreBiomarker({
      biomarkerId: "serum-iron",
      value: 30,
      demographic: { sex: "female", ageYears: 35 },
    });
    expect(inRange.status).toBe("good");
    expect(belowMayo.status).toBe("attention");
    expect(belowMayo.labStatus).toBe("out_of_range");
  });

  it("grades absolute RBC counts and corpuscular indices inside lab bands", () => {
    // RBC bands come from published reference intervals, which define only the
    // 2.5th and 97.5th percentiles — no source designates an optimum inside the
    // interval, so "good" is the best grade this marker can reach.
    const rbc = scoreBiomarker({
      biomarkerId: "rbc",
      value: 4_950_000,
      demographic: { sex: "male", ageYears: 27 },
    });
    expect(rbc.labStatus).toBe("in_range");
    expect(rbc.status).toBe("good");

    expect(scoreBiomarker({ biomarkerId: "mch", value: 29.7 }).status).toBe(
      "optimal",
    );
    expect(scoreBiomarker({ biomarkerId: "mchc", value: 33.4 }).status).toBe(
      "good",
    );
  });

  it("never invents a grade when sourced is false", () => {
    const result = scoreBiomarker({
      biomarkerId: "unsourced-example",
      value: 5,
    });
    expect(result.rangeAvailable).toBe(false);
    expect(result.status).toBeNull();
    expect(result.unavailableReason).toBe("range_not_available");
    expect(result.labStatus).toBe("unknown");
  });

  it("returns range_not_available for unknown markers", () => {
    const result = scoreBiomarker({ biomarkerId: "does-not-exist", value: 1 });
    expect(result.rangeAvailable).toBe(false);
    expect(result.status).toBeNull();
    expect(result.unavailableReason).toBe("range_not_available");
  });

  it("handles missing values without inventing status", () => {
    const result = scoreBiomarker({ biomarkerId: "total-cholesterol", value: null });
    expect(result.rangeAvailable).toBe(true);
    expect(result.status).toBeNull();
    expect(result.unavailableReason).toBe("missing_value");
  });

  it("scores Mayo-sourced ApoA1, iron saturation, and C-peptide", () => {
    const apoMale = scoreBiomarker({
      biomarkerId: "apo-a1",
      value: 146,
      demographic: { sex: "male", ageYears: 27 },
    });
    expect(apoMale.rangeAvailable).toBe(true);
    expect(apoMale.status).toBe("good");
    expect(apoMale.labStatus).toBe("in_range");

    const apoLow = scoreBiomarker({
      biomarkerId: "apo-a1",
      value: 100,
      demographic: { sex: "male", ageYears: 27 },
    });
    expect(apoLow.status).toBe("attention");

    expect(
      scoreBiomarker({ biomarkerId: "iron-saturation", value: 39 }).status,
    ).toBe("good");
    expect(
      scoreBiomarker({ biomarkerId: "c-peptide", value: 1.72 }).status,
    ).toBe("good");
    expect(
      scoreBiomarker({ biomarkerId: "tc-hdl-ratio", value: 2.4 }).rangeAvailable,
    ).toBe(true);
    expect(scoreBiomarker({ biomarkerId: "tc-hdl-ratio", value: 2.4 }).status).toBe(
      "good",
    );
    expect(scoreBiomarker({ biomarkerId: "tc-hdl-ratio", value: 5.4 }).status).toBe(
      "attention",
    );

    const ldlHdlMale = scoreBiomarker({
      biomarkerId: "ldl-hdl-ratio",
      value: 2.0,
      demographic: { sex: "male", ageYears: 40 },
    });
    expect(ldlHdlMale.rangeAvailable).toBe(true);
    expect(ldlHdlMale.status).toBe("optimal");
    expect(
      scoreBiomarker({
        biomarkerId: "ldl-hdl-ratio",
        value: 8.0,
        demographic: { sex: "male", ageYears: 40 },
      }).status,
    ).toBe("attention");

    expect(scoreBiomarker({ biomarkerId: "eag", value: 100 }).status).toBe(
      "optimal",
    );
    expect(scoreBiomarker({ biomarkerId: "eag", value: 125 }).status).toBe(
      "fair",
    );
    expect(scoreBiomarker({ biomarkerId: "eag", value: 155 }).status).toBe(
      "attention",
    );
  });

  it("grades TSH, morning cortisol, folate, hs-CRP, and Lp(a) on cited cutpoints", () => {
    const demo = { sex: "male" as const, ageYears: 40 };
    expect(scoreBiomarker({ biomarkerId: "tsh", value: 1.8, demographic: demo }).status).toBe(
      "good",
    );
    expect(scoreBiomarker({ biomarkerId: "tsh", value: 5.0, demographic: demo }).status).toBe(
      "attention",
    );
    expect(
      scoreBiomarker({ biomarkerId: "cortisol", value: 12, demographic: demo }).status,
    ).toBe("good");
    expect(
      scoreBiomarker({ biomarkerId: "cortisol", value: 4, demographic: demo }).status,
    ).toBe("attention");
    expect(scoreBiomarker({ biomarkerId: "folate", value: 8 }).status).toBe("good");
    expect(scoreBiomarker({ biomarkerId: "folate", value: 2.5 }).status).toBe(
      "attention",
    );
    expect(scoreBiomarker({ biomarkerId: "crp", value: 0.6 }).status).toBe("optimal");
    expect(scoreBiomarker({ biomarkerId: "crp", value: 2.0 }).status).toBe("good");
    expect(scoreBiomarker({ biomarkerId: "crp", value: 4.1 }).status).toBe(
      "attention",
    );
    expect(scoreBiomarker({ biomarkerId: "lp-a", value: 20 }).status).toBe("good");
    expect(scoreBiomarker({ biomarkerId: "lp-a", value: 75 }).status).toBe(
      "attention",
    );
  });

  it("grades ApoB:ApoA1 on Mayo APOAB sex-specific risk tiers", () => {
    const maleLow = scoreBiomarker({
      biomarkerId: "apo-b-apo-a1-ratio",
      value: 0.65,
      demographic: { sex: "male", ageYears: 40 },
    });
    expect(maleLow.rangeAvailable).toBe(true);
    expect(maleLow.status).toBe("optimal");
    expect(maleLow.labStatus).toBe("in_range");

    expect(
      scoreBiomarker({
        biomarkerId: "apo-b-apo-a1-ratio",
        value: 0.8,
        demographic: { sex: "male", ageYears: 40 },
      }).status,
    ).toBe("good");
    expect(
      scoreBiomarker({
        biomarkerId: "apo-b-apo-a1-ratio",
        value: 1.0,
        demographic: { sex: "male", ageYears: 40 },
      }).status,
    ).toBe("attention");

    const femaleMid = scoreBiomarker({
      biomarkerId: "apo-b-apo-a1-ratio",
      value: 0.65,
      demographic: { sex: "female", ageYears: 40 },
    });
    expect(femaleMid.status).toBe("good");
    expect(femaleMid.labStatus).toBe("in_range");
    expect(
      scoreBiomarker({
        biomarkerId: "apo-b-apo-a1-ratio",
        value: 0.85,
        demographic: { sex: "female", ageYears: 40 },
      }).labStatus,
    ).toBe("out_of_range");
  });

  it("scores US BUN (urea id) on Mayo intervals, not European urea", () => {
    const male = scoreBiomarker({
      biomarkerId: "urea",
      value: 16,
      demographic: { sex: "male", ageYears: 27 },
    });
    expect(male.rangeAvailable).toBe(true);
    expect(male.status).toBe("good");
    expect(male.labStatus).toBe("in_range");
    expect(male.range?.labLow).toBe(8);
    expect(male.range?.labHigh).toBe(24);

    const female = scoreBiomarker({
      biomarkerId: "urea",
      value: 16,
      demographic: { sex: "female", ageYears: 27 },
    });
    expect(female.status).toBe("good");
    expect(female.range?.labLow).toBe(6);
    expect(female.range?.labHigh).toBe(21);

    expect(
      scoreBiomarker({
        biomarkerId: "urea",
        value: 5,
        demographic: { sex: "male", ageYears: 27 },
      }).status,
    ).toBe("attention");
  });

  it("scores Mayo-sourced ALT, AST, and CBC counts", () => {
    expect(
      scoreBiomarker({
        biomarkerId: "alt",
        value: 28,
        demographic: { sex: "male", ageYears: 40 },
      }).status,
    ).toBe("good");
    expect(
      scoreBiomarker({
        biomarkerId: "alt",
        value: 50,
        demographic: { sex: "female", ageYears: 40 },
      }).status,
    ).toBe("attention");
    expect(
      scoreBiomarker({
        biomarkerId: "wbc",
        value: 6700,
      }).status,
    ).toBe("good");
    expect(
      scoreBiomarker({
        biomarkerId: "wbc",
        value: 11000,
      }).status,
    ).toBe("attention");
    expect(
      scoreBiomarker({
        biomarkerId: "vitamin-b12",
        value: 450,
      }).status,
    ).toBe("good");
  });

  it("scores ADA/Mayo HbA1c and Mayo/ACC ApoB with published interiors", () => {
    expect(scoreBiomarker({ biomarkerId: "hba1c", value: 5.4 }).status).toBe(
      "optimal",
    );
    expect(scoreBiomarker({ biomarkerId: "hba1c", value: 6.0 }).status).toBe(
      "fair",
    );
    expect(scoreBiomarker({ biomarkerId: "hba1c", value: 6.7 }).status).toBe(
      "attention",
    );

    const apo = scoreBiomarker({
      biomarkerId: "apo-b",
      value: 80,
      demographic: { sex: "male", ageYears: 40 },
    });
    expect(apo.rangeAvailable).toBe(true);
    expect(apo.status).toBe("optimal");
    expect(
      scoreBiomarker({
        biomarkerId: "apo-b",
        value: 110,
        demographic: { sex: "male", ageYears: 40 },
      }).status,
    ).toBe("fair");
  });

  it("scores KDIGO eGFR and Mayo adult chemistry placeholders", () => {
    expect(scoreBiomarker({ biomarkerId: "egfr", value: 95 }).status).toBe(
      "optimal",
    );
    expect(scoreBiomarker({ biomarkerId: "egfr", value: 70 }).status).toBe(
      "good",
    );
    expect(scoreBiomarker({ biomarkerId: "egfr", value: 50 }).status).toBe(
      "fair",
    );
    expect(
      scoreBiomarker({
        biomarkerId: "alp",
        value: 70,
        demographic: { sex: "male", ageYears: 40 },
      }).status,
    ).toBe("good");
    expect(
      scoreBiomarker({
        biomarkerId: "testosterone",
        value: 500,
        demographic: { sex: "male", ageYears: 27 },
      }).status,
    ).toBe("good");
    expect(
      scoreBiomarker({
        biomarkerId: "estradiol",
        value: 80,
        demographic: { sex: "female", ageYears: 30 },
      }).rangeAvailable,
    ).toBe(false);
  });

  it("grades VLDL, UIBC, FAI, BUN:creatinine, and Mayo transferrin from named catalogs", () => {
    expect(scoreBiomarker({ biomarkerId: "vldl-cholesterol", value: 22 }).status).toBe(
      "good",
    );
    expect(scoreBiomarker({ biomarkerId: "vldl-cholesterol", value: 35 }).status).toBe(
      "attention",
    );

    expect(
      scoreBiomarker({
        biomarkerId: "uibc",
        value: 200,
        demographic: { sex: "male", ageYears: 40 },
      }).status,
    ).toBe("good");
    expect(
      scoreBiomarker({
        biomarkerId: "uibc",
        value: 90,
        demographic: { sex: "male", ageYears: 40 },
      }).status,
    ).toBe("attention");
    expect(
      scoreBiomarker({
        biomarkerId: "uibc",
        value: 200,
        demographic: { sex: "male", ageYears: 70 },
      }).rangeAvailable,
    ).toBe(false);

    expect(
      scoreBiomarker({
        biomarkerId: "fai",
        value: 50,
        demographic: { sex: "male", ageYears: 25 },
      }).status,
    ).toBe("good");
    expect(
      scoreBiomarker({
        biomarkerId: "fai",
        value: 4,
        demographic: { sex: "female", ageYears: 30 },
      }).status,
    ).toBe("good");
    expect(
      scoreBiomarker({
        biomarkerId: "fai",
        value: 12,
        demographic: { sex: "female", ageYears: 30 },
      }).status,
    ).toBe("attention");

    expect(
      scoreBiomarker({
        biomarkerId: "bun-creatinine-ratio",
        value: 14,
        demographic: { sex: "male", ageYears: 40 },
      }).status,
    ).toBe("good");
    expect(
      scoreBiomarker({
        biomarkerId: "bun-creatinine-ratio",
        value: 28,
        demographic: { sex: "female", ageYears: 40 },
      }).status,
    ).toBe("attention");

    const transferrin = scoreBiomarker({ biomarkerId: "transferrin", value: 250 });
    expect(transferrin.rangeAvailable).toBe(true);
    expect(transferrin.status).toBe("good");
    expect(transferrin.range?.sourceRefs[0]?.url).toMatch(/34623/);

    expect(
      scoreBiomarker({ biomarkerId: "tg-hdl-ratio", value: 2 }).status,
    ).toBe("good");
    expect(
      scoreBiomarker({ biomarkerId: "tg-hdl-ratio", value: 3.5 }).status,
    ).toBe("attention");
    expect(
      scoreBiomarker({ biomarkerId: "ldl-apo-b-ratio", value: 1.2 }).status,
    ).toBe("good");
    expect(
      scoreBiomarker({ biomarkerId: "ldl-apo-b-ratio", value: 1.1 }).status,
    ).toBe("attention");
    expect(
      scoreBiomarker({
        biomarkerId: "percent-free-testosterone",
        value: 2.5,
        demographic: { sex: "male", ageYears: 35 },
      }).status,
    ).toBe("good");
    expect(
      scoreBiomarker({
        biomarkerId: "percent-free-testosterone",
        value: 1.2,
        demographic: { sex: "female", ageYears: 35 },
      }).status,
    ).toBe("good");
    expect(
      scoreBiomarker({ biomarkerId: "ast-alt-ratio", value: 1.1 }).rangeAvailable,
    ).toBe(false);
  });
});
