import { describe, expect, it } from "vitest";
import { buildPersonalizedActionPlan } from "./action-plan-builder";

describe("buildPersonalizedActionPlan", () => {
  it("personalizes meals around flagged lipid markers without lab values", () => {
    const plan = buildPersonalizedActionPlan({
      demographic: { sex: "male", ageYears: 34 },
      markers: [
        {
          id: "ldl-cholesterol",
          name: "LDL",
          section: "Lipids",
          value: 160,
          unit: "mg/dL",
          status: "attention",
          labStatus: "out_of_range",
        },
        {
          id: "hdl-cholesterol",
          name: "HDL",
          section: "Lipids",
          value: 38,
          unit: "mg/dL",
          status: "fair",
          labStatus: "in_range",
        },
      ],
    });

    expect(plan.summary).toMatch(/higher LDL|LDL cholesterol/i);
    expect(plan.summary).not.toMatch(/mg\/dL|\b160\b|\b38\b/);
    expect(plan.focus.some((f) => /lipid|heart/i.test(f))).toBe(true);
    const foods = plan.routine.flatMap((b) => b.items.map((i) => i.food));
    const foodBlob = foods.join(" ");
    expect(foodBlob).toMatch(/25–30 minutes|2–2\.5 liters|300–400 ml/i);
    expect(foodBlob).toMatch(/oat|salmon|lentil|walnut|flax|yogurt|eggs/i);
    expect(
      plan.routine.some((b) =>
        b.items.some(
          (i) =>
            i.marker &&
            /given your/i.test(i.marker) &&
            !/mg\/dL|\b160\b|\b38\b/.test(i.marker),
        ),
      ),
    ).toBe(true);
  });

  it("ties hydration and meals to flagged kidney markers", () => {
    const plan = buildPersonalizedActionPlan({
      demographic: { sex: "male", ageYears: 42 },
      markers: [
        {
          id: "urea",
          name: "Urea",
          section: "Kidney",
          value: 52,
          unit: "mg/dL",
          status: "attention",
          labStatus: "out_of_range",
        },
        {
          id: "creatinine",
          name: "Creatinine",
          section: "Kidney",
          value: 1.4,
          unit: "mg/dL",
          status: "fair",
          labStatus: "in_range",
        },
      ],
    });

    expect(plan.summary).toMatch(/urea|creatinine/i);
    expect(plan.focus.some((f) => /kidney/i.test(f))).toBe(true);
    const blob = plan.routine
      .flatMap((b) => b.items.map((i) => `${i.food} ${i.why ?? ""} ${i.marker ?? ""}`))
      .join(" ");
    expect(blob).toMatch(/urea|creatinine/i);
    expect(blob).toMatch(/300–400 ml|2–2\.5 liters/i);
    expect(blob).not.toMatch(/overall nutritional balance/i);
    expect(
      plan.routine.some((b) =>
        b.items.some((i) => i.marker && /given your.*urea|creatinine/i.test(i.marker)),
      ),
    ).toBe(true);
  });

  it("gives different seeds for lipid-flagged vs kidney-flagged users", () => {
    const lipid = buildPersonalizedActionPlan({
      demographic: { sex: "female", ageYears: 36 },
      markers: [
        {
          id: "ldl-cholesterol",
          name: "LDL",
          section: "Lipids",
          value: 170,
          unit: "mg/dL",
          status: "attention",
          labStatus: "out_of_range",
        },
      ],
    });
    const kidney = buildPersonalizedActionPlan({
      demographic: { sex: "female", ageYears: 36 },
      markers: [
        {
          id: "urea",
          name: "Urea",
          section: "Kidney",
          value: 50,
          unit: "mg/dL",
          status: "attention",
          labStatus: "out_of_range",
        },
      ],
    });

    expect(lipid.focus.join(" ")).not.toEqual(kidney.focus.join(" "));
    const lipidFood = lipid.routine.flatMap((b) => b.items.map((i) => i.food)).join(" ");
    const kidneyFood = kidney.routine.flatMap((b) => b.items.map((i) => i.food)).join(" ");
    expect(lipidFood).toMatch(/oat|flax|walnut|salmon|walk/i);
    expect(kidneyFood).toMatch(/salt|water|fluid/i);
    expect(lipid.summary).toMatch(/LDL/i);
    expect(kidney.summary).toMatch(/urea/i);
  });

  it("notes missing kidney markers when hydration is general-only", () => {
    const plan = buildPersonalizedActionPlan({
      demographic: { sex: "male", ageYears: 30 },
      markers: [
        {
          id: "ldl-cholesterol",
          name: "LDL",
          section: "Lipids",
          value: 155,
          unit: "mg/dL",
          status: "attention",
          labStatus: "out_of_range",
        },
      ],
    });
    const hydrationWhy = plan.routine
      .filter((b) => /hydration/i.test(b.title))
      .flatMap((b) => b.items.map((i) => i.why))
      .join(" ");
    expect(hydrationWhy).toMatch(/kidney|urea|creatinine/i);
  });

  it("builds a maintenance plan when nothing is flagged", () => {
    const plan = buildPersonalizedActionPlan({
      demographic: { sex: "female", ageYears: 28 },
      markers: [
        {
          id: "hemoglobin",
          name: "Hemoglobin",
          section: "CBC",
          value: 13.5,
          unit: "g/dL",
          status: "optimal",
          labStatus: "in_range",
        },
      ],
    });
    expect(plan.summary.toLowerCase()).toMatch(/steady|maintenance|balanced/);
    expect(plan.routine.length).toBeGreaterThanOrEqual(6);
  });
});
