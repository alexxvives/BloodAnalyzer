import { describe, expect, it } from "vitest";
import { alignActionPlanCues, parseActionPlanJson } from "./action-plan";

describe("parseActionPlanJson", () => {
  it("accepts routine JSON with plain-language marker cues", () => {
    const plan = parseActionPlanJson(
      JSON.stringify({
        summary: "Focus on your higher LDL cholesterol with walks and fiber.",
        routine: [
          {
            time: "12:30–13:00",
            title: "After-lunch walk",
            items: [
              {
                food: "Walk briskly for 25–30 minutes",
                marker: "given your higher LDL cholesterol",
                why: "A short post-meal walk supports a heart-friendly routine",
              },
            ],
          },
        ],
        focus: ["Post-meal walks"],
      }),
    );
    expect(plan.routine[0]?.items[0]?.food).toMatch(/25–30 minutes/);
    expect(plan.routine[0]?.items[0]?.marker).toBe(
      "given your higher LDL cholesterol",
    );
    expect(plan.focus).toHaveLength(1);
  });

  it("strips accidental lab values from model output", () => {
    const plan = parseActionPlanJson(
      JSON.stringify({
        summary: "Your LDL 160 mg/dL needs lifestyle support.",
        routine: [
          {
            time: "7:00",
            title: "Wake",
            items: [
              {
                food: "Drink water",
                marker: "given HDL Cholesterol 56 mg/dL",
                why: "Supports HDL 56 mg/dL",
              },
            ],
          },
        ],
        focus: ["HDL 38 mg/dL"],
      }),
    );
    expect(plan.summary).not.toMatch(/mg\/dL|\b160\b/);
    expect(plan.routine[0]?.items[0]?.marker).not.toMatch(/mg\/dL|\b56\b/);
    expect(plan.routine[0]?.items[0]?.why).not.toMatch(/mg\/dL/);
    expect(plan.focus[0]).not.toMatch(/mg\/dL/);
  });

  it("normalizes legacy meals shape", () => {
    const plan = parseActionPlanJson(
      JSON.stringify({
        summary: "Keep a steady routine.",
        meals: {
          breakfast: "Oats and berries",
          lunch: "Salmon salad",
          dinner: "Beans and rice",
        },
        habits: ["Walk 30 minutes"],
        focus: ["Sleep timing"],
      }),
    );
    expect(plan.routine.some((b) => b.title === "Lunch")).toBe(true);
    expect(plan.routine.find((b) => b.title === "Habits")?.items[0]?.food).toBe(
      "Walk 30 minutes",
    );
  });

  it("strips fenced JSON", () => {
    const plan = parseActionPlanJson(`\`\`\`json
{"summary":"A","routine":[{"time":"7:00","title":"Wake","items":[{"food":"Water","why":"Hydration"}]}],"focus":["F"]}
\`\`\``);
    expect(plan.summary).toBe("A");
  });

  it("aligns bare/glued marker cues to status-specific phrases", () => {
    const plan = alignActionPlanCues(
      {
        summary: "Stay hydrated for overall health.",
        focus: ["Hydration"],
        routine: [
          {
            time: "8:30–12:30",
            title: "Morning hydration",
            items: [
              {
                food: "Sip toward about 1 liter by lunchtime",
                marker: "given your creatinineMorning hydration supports kidney function and overall health.",
                why: "",
              },
            ],
          },
        ],
      },
      [
        {
          id: "creatinine",
          name: "Creatinine",
          section: "Kidney",
          value: 1.3,
          unit: "mg/dL",
          status: "fair",
          labStatus: "in_range",
        },
      ],
    );

    const item = plan.routine[0]?.items[0];
    expect(item?.marker).toMatch(/given your above-optimal creatinine/i);
    expect(item?.marker).not.toMatch(/Morning hydration/i);
    expect(item?.why).toMatch(/above-optimal creatinine/i);
    expect(plan.summary).toMatch(/above-optimal creatinine/i);
  });
});
