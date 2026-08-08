import {
  formatMarkerRef,
  type ActionPlanBlock,
  type ActionPlanFoodItem,
  type ActionPlanMarkerInput,
  type ActionPlanRequestBody,
  type ActionPlanResult,
} from "@/lib/report/action-plan";

export { formatMarkerRef };

type Priority = "high" | "medium" | "low";

type FocusTheme = {
  id: string;
  label: string;
  priority: Priority;
  markerNames: string[];
  breakfast: ActionPlanFoodItem[];
  lunch: ActionPlanFoodItem[];
  dinner: ActionPlanFoodItem[];
  snack: ActionPlanFoodItem[];
  habits: ActionPlanFoodItem[];
};

const PRIORITY_RANK: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function needsAttention(m: ActionPlanMarkerInput): boolean {
  return (
    m.status === "attention" ||
    m.status === "fair" ||
    m.labStatus === "out_of_range"
  );
}

function matchAny(m: ActionPlanMarkerInput, ids: string[], nameHints: string[]) {
  const id = m.id.toLowerCase();
  const name = m.name.toLowerCase();
  return (
    ids.some((x) => id.includes(x)) ||
    nameHints.some((h) => name.includes(h))
  );
}

function opt(
  food: string,
  why: string,
  marker?: string,
): ActionPlanFoodItem {
  return marker ? { food, why, marker } : { food, why };
}

function themeForMarkers(markers: ActionPlanMarkerInput[]): FocusTheme[] {
  const flagged = markers.filter(needsAttention);
  const pool = flagged.length > 0 ? flagged : markers;
  const themes: FocusTheme[] = [];

  const lipids = pool.filter((m) =>
    matchAny(
      m,
      ["ldl", "hdl", "triglyceride", "total-cholesterol", "lp-a"],
      ["ldl", "hdl", "triglyceride", "cholesterol", "lp(a)"],
    ),
  );
  if (lipids.length) {
    const names = lipids.map(formatMarkerRef);
    const m0 = names[0];
    themes.push({
      id: "lipids",
      label: `Lipid support (${names.slice(0, 2).join(", ")})`,
      priority: lipids.some(
        (m) => m.status === "attention" || m.labStatus === "out_of_range",
      )
        ? "high"
        : "medium",
      markerNames: names,
      breakfast: [
        opt(
          "Oats/overnight oats with flax/chia + berries/apple · or · eggs + avocado toast",
          `Soluble fiber and unsaturated fats are commonly discussed with ${m0}`,
          m0,
        ),
        opt(
          "Walnuts/almonds (small handful) or plain yogurt",
          `A light unsaturated-fat add-on people often include alongside ${m0}`,
          m0,
        ),
      ],
      lunch: [
        opt(
          "Lentil/chickpea/bean bowl with olive oil · or · grilled fish + mixed salad",
          `Plant fiber or oily fish patterns are commonly discussed with ${m0}`,
          m0,
        ),
        opt(
          "Tomato/cucumber/greens side (vinaigrette, not creamy)",
          "Produce volume without heavy saturated fat",
          m0,
        ),
      ],
      dinner: [
        opt(
          "Salmon/sardines/trout with quinoa/brown rice + greens · or · tofu–veg stir-fry",
          `Oily fish or plant dinners are commonly discussed when ${m0} needs attention`,
          m0,
        ),
      ],
      snack: [
        opt(
          "Apple/pear/berries + a few almonds/walnuts",
          `Simple fiber + fat snack while focusing on ${m0}`,
          m0,
        ),
      ],
      habits: [
        opt(
          "Brisk walk after lunch or dinner (20–30 min)",
          `Post-meal movement is commonly discussed with ${m0}`,
          m0,
        ),
      ],
    });
  }

  const glucose = pool.filter((m) =>
    matchAny(m, ["glucose", "hba1c", "insulin"], ["glucose", "a1c", "hba1c", "insulin"]),
  );
  if (glucose.length) {
    const names = glucose.map(formatMarkerRef);
    const m0 = names[0];
    themes.push({
      id: "glucose",
      label: `Steady energy (${m0})`,
      priority: "high",
      markerNames: names,
      breakfast: [
        opt(
          "Greek yogurt + berries/apple/pear · or · eggs/tofu scramble + veg",
          `Protein + fiber pairings are commonly discussed with ${m0}`,
          m0,
        ),
      ],
      lunch: [
        opt(
          "Chicken/tempeh/tofu over greens + barley/quinoa · or · bean salad plate",
          `Protein-forward, slower-carb lunches are commonly discussed with ${m0}`,
          m0,
        ),
        opt(
          "Extra broccoli/cucumber/peppers/leafy greens",
          `Volume without a large glycemic load alongside ${m0}`,
          m0,
        ),
      ],
      dinner: [
        opt(
          "Bean–veg chili or lentil stew + salad · or · fish + sweet potato + greens",
          `Legume fiber or balanced plates are commonly discussed with ${m0}`,
          m0,
        ),
      ],
      snack: [
        opt(
          "Cottage cheese/hummus + carrots · or · yogurt (plain)",
          `Protein/fiber snack instead of sweets while focusing on ${m0}`,
          m0,
        ),
      ],
      habits: [
        opt(
          "Short walk after lunch and/or dinner",
          `Post-meal walks are commonly discussed with ${m0}`,
          m0,
        ),
      ],
    });
  }

  const iron = pool.filter((m) =>
    matchAny(
      m,
      ["ferritin", "iron", "transferrin", "hemoglobin", "hematocrit"],
      ["ferritin", "iron", "transferrin", "hemoglobin", "hematocrit"],
    ),
  );
  if (iron.length) {
    const names = iron.map(formatMarkerRef);
    const m0 = names[0];
    const lowish = iron.some(
      (m) =>
        m.status === "attention" ||
        m.status === "fair" ||
        (typeof m.value === "number" && m.value < 40 && m.id.includes("ferritin")),
    );
    themes.push({
      id: "iron",
      label: `Iron-aware plate (${names.slice(0, 2).join(", ")})`,
      priority: lowish ? "high" : "medium",
      markerNames: names,
      breakfast: [
        opt(
          lowish
            ? "Eggs + spinach/peppers · or · oatmeal + pumpkin seeds + orange/kiwi"
            : "Oatmeal + pumpkin seeds/almonds · or · yogurt + fruit",
          lowish
            ? `Iron-containing foods + vitamin C are commonly discussed with ${m0}`
            : `Balanced breakfast while monitoring ${m0}`,
          m0,
        ),
      ],
      lunch: [
        opt(
          lowish
            ? "Lean beef/lentil stew + broccoli · or · chickpea salad + citrus"
            : "Turkey/chicken wrap + greens · or · bean bowl",
          lowish
            ? `Heme or plant iron options commonly discussed with ${m0}`
            : `Steady protein lunch alongside ${m0}`,
          m0,
        ),
      ],
      dinner: [
        opt(
          lowish
            ? "Chicken/lentils + red peppers · or · fish + greens + citrus side"
            : "White fish/tofu + greens + peppers · or · bean–veg plate",
          `Protein with vitamin C–rich sides commonly discussed with ${m0}`,
          m0,
        ),
      ],
      snack: [
        opt(
          lowish
            ? "Pumpkin seeds/trail mix · or · yogurt"
            : "Yogurt + berries/apple · or · handful of nuts",
          `Light snack options while focusing on ${m0}`,
          m0,
        ),
      ],
      habits: [
        opt(
          "Pair plant-iron meals with citrus; tea/coffee between meals",
          "Timing habits people commonly discuss with iron markers",
          m0,
        ),
      ],
    });
  }

  const inflammation = pool.filter((m) =>
    matchAny(m, ["crp", "esr", "homocysteine"], ["crp", "esr", "sed", "homocysteine"]),
  );
  if (inflammation.length) {
    const names = inflammation.map(formatMarkerRef);
    const m0 = names[0];
    themes.push({
      id: "inflammation",
      label: `Recovery-minded routine (${m0})`,
      priority: "medium",
      markerNames: names,
      breakfast: [
        opt(
          "Berries/apple with yogurt · or · turmeric-spiced eggs + greens",
          `Colorful produce + protein patterns often discussed with ${m0}`,
          m0,
        ),
      ],
      lunch: [
        opt(
          "Salmon/sardines salad with olive oil · or · chickpea–veg bowl",
          `Omega-3 or plant-forward lunches commonly discussed with ${m0}`,
          m0,
        ),
      ],
      dinner: [
        opt(
          "Veg curry with chickpeas/tofu + rice · or · baked fish + broccoli/greens",
          `Spiced plant or fish dinners often discussed alongside ${m0}`,
          m0,
        ),
      ],
      snack: [
        opt(
          "Berries/cherries/apple · or · handful of nuts",
          "Fruit or nuts instead of fried/processed snacks",
          m0,
        ),
      ],
      habits: [
        opt(
          "Aim for consistent sleep; dim screens later in the evening",
          `Sleep consistency is commonly discussed alongside ${m0}`,
          m0,
        ),
      ],
    });
  }

  const liver = pool.filter((m) =>
    matchAny(m, ["alt", "ast", "ggt"], ["alt", "ast", "ggt", "transaminase"]),
  );
  if (liver.length) {
    const names = liver.map(formatMarkerRef);
    const m0 = names[0];
    themes.push({
      id: "liver",
      label: `Liver-friendly evenings (${m0})`,
      priority: "high",
      markerNames: names,
      breakfast: [
        opt(
          "Oats + berries/apple · or · yogurt + fruit",
          `Simple breakfast while focusing on ${m0} lifestyle context`,
          m0,
        ),
      ],
      lunch: [
        opt(
          "Grilled fish/tofu bowl + salad · or · bean–veg plate (skip deep-fried)",
          `Lighter protein + veg lunches commonly discussed with ${m0}`,
          m0,
        ),
      ],
      dinner: [
        opt(
          "Cod/tofu + steamed greens · or · veg-heavy stir-fry with rice",
          `Lighter dinners are commonly discussed when ${m0} needs attention`,
          m0,
        ),
      ],
      snack: [
        opt(
          "Sparkling water with lemon/lime · or · herbal tea (skip sugary drinks)",
          "Hydration swaps that replace sweet beverages",
          m0,
        ),
      ],
      habits: [
        opt(
          "Alcohol-free evening (or discuss limits with your clinician)",
          `Alcohol load is commonly discussed with ${m0}`,
          m0,
        ),
      ],
    });
  }

  const vitamins = pool.filter((m) =>
    matchAny(
      m,
      ["vitamin-d", "vitamin-b12", "folate", "b12"],
      ["vitamin d", "25(oh)", "b12", "folate", "folic"],
    ),
  );
  if (vitamins.length) {
    const names = vitamins.map(formatMarkerRef);
    const m0 = names[0];
    themes.push({
      id: "vitamins",
      label: `Nutrient-dense basics (${names.slice(0, 2).join(", ")})`,
      priority: "medium",
      markerNames: names,
      breakfast: [
        opt(
          "Fortified yogurt/eggs with mushrooms · or · oats + seeds + fruit",
          `Foods commonly discussed with ${m0}`,
          m0,
        ),
      ],
      lunch: [
        opt(
          "Sardine/egg salad on whole grain · or · leafy greens + beans + olive oil",
          `Nutrient-dense proteins or greens commonly linked with ${m0}`,
          m0,
        ),
      ],
      dinner: [
        opt(
          "Salmon/trout + quinoa/rice + spinach/kale · or · egg–veg plate",
          `Oily fish or greens are commonly discussed with ${m0}`,
          m0,
        ),
      ],
      snack: [
        opt(
          "Fortified plant milk/kefir · or · yogurt",
          "Convenient fortified options between meals",
          m0,
        ),
      ],
      habits: [
        opt(
          "Outdoor daylight before noon when possible",
          "Daylight habit commonly discussed with vitamin D context",
          m0,
        ),
      ],
    });
  }

  const cortisol = pool.filter((m) =>
    matchAny(m, ["cortisol", "tsh"], ["cortisol", "tsh", "thyroid"]),
  );
  if (cortisol.length) {
    const names = cortisol.map(formatMarkerRef);
    const m0 = names[0];
    themes.push({
      id: "rhythm",
      label: `Daily rhythm (${m0})`,
      priority: "medium",
      markerNames: names,
      breakfast: [
        opt(
          "Protein breakfast within ~1h of waking (eggs/yogurt/tofu + fruit)",
          `Regular morning fueling is commonly discussed with ${m0}`,
          m0,
        ),
      ],
      lunch: [
        opt(
          "Balanced plate: protein + produce + whole grain (don't skip)",
          `Steady midday meals support daily rhythm around ${m0}`,
          m0,
        ),
      ],
      dinner: [
        opt(
          "Earlier, lighter dinner — finish ~3h before bed when you can",
          "Meal timing people often discuss with sleep and stress hormones",
          m0,
        ),
      ],
      snack: [
        opt(
          "Herbal tea after mid-afternoon · or · fruit if hungry",
          "Trim late caffeine when supporting wind-down",
          m0,
        ),
      ],
      habits: [
        opt(
          "Consistent bedtime + brief breathwork/stretch",
          `Sleep regularity is commonly discussed with ${m0}`,
          m0,
        ),
      ],
    });
  }

  if (themes.length === 0) {
    const refs = pool.slice(0, 3).map(formatMarkerRef);
    themes.push({
      id: "maintenance",
      label: "Balanced maintenance",
      priority: "low",
      markerNames: refs,
      breakfast: [
        opt(
          "Eggs/Greek yogurt with fruit · or · toast + avocado + veg",
          "Protein-forward start with flexible sides",
          refs[0],
        ),
      ],
      lunch: [
        opt(
          "Grain bowl with beans/greens/olive oil · or · fish + salad",
          "Mediterranean-style options for general maintenance",
          refs[0],
        ),
      ],
      dinner: [
        opt(
          "Fish/legumes + roasted vegetables · or · tofu stir-fry + rice",
          "Simple balanced dinner patterns",
          refs[0],
        ),
      ],
      snack: [
        opt(
          "Fruit + nuts · or · yogurt",
          "Light, satisfying afternoon options",
          refs[0],
        ),
      ],
      habits: [
        opt(
          "20–30 min of walking/preferred movement",
          "Daily activity supports overall marker maintenance",
          refs[0],
        ),
      ],
    });
  }

  return themes.sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  );
}

function pickItems(
  themes: FocusTheme[],
  slot: keyof Pick<
    FocusTheme,
    "breakfast" | "lunch" | "dinner" | "snack" | "habits"
  >,
  max: number,
): ActionPlanFoodItem[] {
  const items: ActionPlanFoodItem[] = [];
  const seen = new Set<string>();
  for (const theme of themes) {
    for (const item of theme[slot]) {
      const key = item.food.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
      if (items.length >= max) return items;
    }
  }
  return items;
}

/**
 * Deterministic, biomarker-driven daily routine seed.
 * Foods use slash/OR alternatives; marker fields drive hover tips in the UI.
 */
export function buildPersonalizedActionPlan(
  input: ActionPlanRequestBody,
): ActionPlanResult {
  const themes = themeForMarkers(input.markers);
  const top = themes.slice(0, 3);
  const focus = top.map((t) => t.label);

  const flagged = input.markers.filter(needsAttention);
  const primary = flagged[0] ? formatMarkerRef(flagged[0]) : undefined;
  const summary =
    flagged.length > 0
      ? `Today’s routine is shaped around your results: ${flagged
          .slice(0, 3)
          .map(formatMarkerRef)
          .join("; ")}${flagged.length > 3 ? "; and related markers" : ""}.`
      : `Markers look broadly steady for a ${input.demographic.sex}, age ${input.demographic.ageYears} profile — a balanced maintenance routine to discuss with your clinician as needed.`;

  const routine: ActionPlanBlock[] = [
    {
      time: "7:00",
      title: "Wake / hydration",
      items: [
        opt(
          "Water / herbal tea before caffeine",
          "Simple hydration start",
          primary,
        ),
      ],
    },
    {
      time: "7:15–7:30",
      title: "Light movement + daylight",
      items: [
        opt(
          "Stretch / short outdoor walk / easy mobility",
          top[0]?.habits[0]?.why ??
            "Daylight and movement support daily rhythm",
          top[0]?.habits[0]?.marker ?? primary,
        ),
      ],
    },
    {
      time: "7:30–8:30",
      title: "Breakfast",
      items: pickItems(top, "breakfast", 3),
    },
    {
      time: "8:30–12:30",
      title: "Morning hydration",
      items: [
        opt(
          "Water across the morning (sip steadily)",
          "Steady hydration between meals",
          primary,
        ),
      ],
    },
    {
      time: "12:30–13:30",
      title: "Lunch",
      items: pickItems(top, "lunch", 3),
      note: "Dessert optional — fruit is usually enough",
    },
    {
      time: "15:30–16:30",
      title: "Optional snack",
      items: pickItems(top, "snack", 2),
    },
    {
      time: "19:00–20:00",
      title: "Dinner",
      items: pickItems(top, "dinner", 3),
    },
    {
      time: "Day",
      title: "Key habits",
      items: pickItems(top, "habits", 3),
    },
    {
      time: "22:00",
      title: "Wind-down",
      items: [
        opt(
          "Screens down + light stretch / reading / breathwork",
          "Protect sleep quality so tomorrow’s routine is easier to keep",
          primary,
        ),
      ],
    },
  ].filter((b) => b.items.length > 0);

  return { summary, routine, focus };
}
