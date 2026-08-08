import { describe, expect, it } from "vitest";
import { buildPersonalizedActionPlan } from "./action-plan-builder";

describe("buildPersonalizedActionPlan", () => {
  it("personalizes meals around flagged lipid markers", () => {
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

    expect(plan.summary).toMatch(/LDL 160 mg\/dL/i);
    expect(plan.summary).toMatch(/HDL 38 mg\/dL/i);
    expect(plan.focus.some((f) => /lipid/i.test(f))).toBe(true);
    const foods = plan.routine.flatMap((b) => b.items.map((i) => i.food));
    const foodBlob = foods.join(" ");
    expect(foodBlob).toMatch(/\/|\bor\b/i);
    expect(foodBlob).toMatch(/oat|salmon|lentil|walnut|flax|yogurt|eggs/i);
    expect(
      plan.routine.some((b) =>
        b.items.some((i) => i.marker && /160 mg\/dL|38 mg\/dL/i.test(i.marker)),
      ),
    ).toBe(true);
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
