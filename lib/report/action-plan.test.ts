import { describe, expect, it } from "vitest";
import { parseActionPlanJson } from "./action-plan";

describe("parseActionPlanJson", () => {
  it("accepts routine JSON", () => {
    const plan = parseActionPlanJson(
      JSON.stringify({
        summary: "Keep a steady routine.",
        routine: [
          {
            time: "7:30–8:30",
            title: "Breakfast",
            items: [
              {
                food: "Eggs/tofu scramble OR yogurt + berries/apple",
                marker: "LDL 160 mg/dL",
                why: "Protein + fiber pattern commonly discussed with this lipid result",
              },
            ],
          },
        ],
        focus: ["Sleep timing"],
      }),
    );
    expect(plan.routine[0]?.items[0]?.food).toMatch(/OR|\//);
    expect(plan.routine[0]?.items[0]?.marker).toBe("LDL 160 mg/dL");
    expect(plan.focus).toHaveLength(1);
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
});
