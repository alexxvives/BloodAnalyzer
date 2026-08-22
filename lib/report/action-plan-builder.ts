import {
  type ActionPlanBlock,
  type ActionPlanFoodItem,
  type ActionPlanMarkerInput,
  type ActionPlanRequestBody,
  type ActionPlanResult,
} from "@/lib/report/action-plan";
import {
  givenMarkerPhrase,
  plainMarkerCue,
  priorityMarkers,
} from "@/lib/report/action-plan-language";

type Priority = "high" | "medium" | "low";

type FocusTheme = {
  id: string;
  label: string;
  priority: Priority;
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

const KIDNEY_IDS = ["urea", "bun", "creatinine", "egfr", "uric"];
const KIDNEY_NAME_HINTS = [
  "urea",
  "bun",
  "creatinine",
  "egfr",
  "gfr",
  "uric",
];

function needsAttention(m: ActionPlanMarkerInput): boolean {
  return (
    m.status === "attention" ||
    m.status === "fair" ||
    m.labStatus === "out_of_range"
  );
}

function severityRank(m: ActionPlanMarkerInput): number {
  if (m.labStatus === "out_of_range" || m.status === "attention") return 0;
  if (m.status === "fair") return 1;
  return 2;
}

/** Flagged markers first (worst first), then remaining — deterministic order. */
function rankMarkers(markers: ActionPlanMarkerInput[]): ActionPlanMarkerInput[] {
  return [...markers].sort((a, b) => {
    const sa = severityRank(a);
    const sb = severityRank(b);
    if (sa !== sb) return sa - sb;
    return a.id.localeCompare(b.id);
  });
}

function matchAny(m: ActionPlanMarkerInput, ids: string[], nameHints: string[]) {
  const id = m.id.toLowerCase();
  const name = m.name.toLowerCase();
  return (
    ids.some((x) => id.includes(x)) ||
    nameHints.some((h) => name.includes(h))
  );
}

function isKidneyMarker(m: ActionPlanMarkerInput): boolean {
  return matchAny(m, KIDNEY_IDS, KIDNEY_NAME_HINTS);
}

function opt(
  food: string,
  why: string,
  marker?: string,
): ActionPlanFoodItem {
  return marker ? { food, why, marker } : { food, why };
}

function cue(m: ActionPlanMarkerInput): string {
  return givenMarkerPhrase(m);
}

/** Rotate cues across markers in a theme so one plan isn't stuck on a single phrase. */
function cuesFor(markers: ActionPlanMarkerInput[]): string[] {
  const ranked = rankMarkers(markers);
  return ranked.map(cue);
}

function cueAt(cues: string[], index: number, fallback?: string): string | undefined {
  if (cues.length === 0) return fallback;
  return cues[index % cues.length] ?? fallback;
}

function themeForMarkers(markers: ActionPlanMarkerInput[]): FocusTheme[] {
  const flagged = rankMarkers(markers.filter(needsAttention));
  const pool = flagged.length > 0 ? flagged : rankMarkers(markers);
  const themes: FocusTheme[] = [];

  const lipids = pool.filter((m) =>
    matchAny(
      m,
      ["ldl", "hdl", "triglyceride", "total-cholesterol", "lp-a"],
      ["ldl", "hdl", "triglyceride", "cholesterol", "lp(a)"],
    ),
  );
  if (lipids.length) {
    const cs = cuesFor(lipids);
    const trig = lipids.find((m) =>
      matchAny(m, ["triglyceride"], ["triglyceride"]),
    );
    const ldl = lipids.find((m) => matchAny(m, ["ldl"], ["ldl"]));
    themes.push({
      id: "lipids",
      label: "Heart-friendly lipids",
      priority: lipids.some(
        (m) => m.status === "attention" || m.labStatus === "out_of_range",
      )
        ? "high"
        : "medium",
      breakfast: [
        opt(
          trig
            ? "Skip sugary breakfast drinks; choose oats with flax/chia and berries, OR eggs with avocado toast"
            : "Eat a fiber-forward breakfast: oats with flax/chia and berries, OR eggs with avocado toast",
          trig
            ? "Soluble fiber and fewer liquid sugars are common lifestyle levers discussed with triglycerides"
            : "Soluble fiber and unsaturated fats are common lifestyle levers discussed with LDL / cholesterol markers",
          cueAt(cs, 0),
        ),
      ],
      lunch: [
        opt(
          "Build lunch around beans/lentils or grilled fish plus a large salad with olive oil",
          ldl
            ? "Plant fiber and oily fish patterns are often discussed alongside LDL support"
            : "Plant fiber and oily fish patterns are often discussed for lipid support",
          cueAt(cs, 1),
        ),
      ],
      dinner: [
        opt(
          "Choose salmon/sardines/trout with quinoa or brown rice and greens, OR a tofu–veg stir-fry",
          "An evening plate rich in unsaturated fats and plants supports a heart-friendly lipid day",
          cueAt(cs, 2),
        ),
      ],
      snack: [
        opt(
          trig
            ? "Have fruit or a small handful of walnuts — skip chips, pastries, and sugary drinks"
            : "Have a small handful of walnuts/almonds with an apple or berries (not a bag of chips)",
          trig
            ? "A fiber-plus-fat snack instead of refined carbs is a practical triglyceride-aware swap"
            : "A simple fiber-plus-fat snack instead of ultra-processed options",
          cueAt(cs, 0),
        ),
      ],
      habits: [
        opt(
          "Walk briskly for 25–30 minutes within an hour after lunch or dinner",
          "A timed post-meal walk is a concrete habit people use alongside lipid-focused routines",
          cueAt(cs, 1),
        ),
      ],
    });
  }

  const glucose = pool.filter((m) =>
    matchAny(m, ["glucose", "hba1c", "insulin"], ["glucose", "a1c", "hba1c", "insulin"]),
  );
  if (glucose.length) {
    const cs = cuesFor(glucose);
    const a1c = glucose.find((m) => matchAny(m, ["hba1c"], ["a1c", "hba1c"]));
    themes.push({
      id: "glucose",
      label: "Glucose-aware meals",
      priority: "high",
      breakfast: [
        opt(
          "Start with protein + fiber: Greek yogurt with berries, OR eggs/tofu scramble with vegetables",
          a1c
            ? "Protein-plus-fiber breakfasts are commonly discussed for steadier glucose and A1C lifestyle context"
            : "Protein-plus-fiber breakfasts are commonly discussed for steadier fasting-glucose support than sugary starts",
          cueAt(cs, 0),
        ),
      ],
      lunch: [
        opt(
          "Make lunch protein-forward: chicken/tempeh/tofu over greens with barley/quinoa, OR a bean salad plate",
          "Slower carbs plus protein are commonly discussed for glucose-aware daytime meals",
          cueAt(cs, 1),
        ),
      ],
      dinner: [
        opt(
          "Keep dinner balanced: bean–veg chili or lentil stew with salad, OR fish with a fist-sized sweet potato and greens",
          "A measured starch portion with protein and veg is a repeatable glucose-aware dinner pattern",
          cueAt(cs, 2),
        ),
      ],
      snack: [
        opt(
          "If hungry mid-afternoon, choose cottage cheese/hummus with carrots, OR plain yogurt — skip candy and soda",
          "A protein/fiber snack instead of sweets supports glucose-aware afternoons",
          cueAt(cs, 0),
        ),
      ],
      habits: [
        opt(
          "Take a 10–15 minute walk after lunch and again after dinner",
          "Short post-meal walks are a simple, timed habit often paired with glucose-focused routines",
          cueAt(cs, 1),
        ),
      ],
    });
  }

  const kidney = pool.filter(isKidneyMarker);
  if (kidney.length) {
    const cs = cuesFor(kidney);
    const urea = kidney.find((m) => matchAny(m, ["urea", "bun"], ["urea", "bun"]));
    const creat = kidney.find((m) =>
      matchAny(m, ["creatinine"], ["creatinine"]),
    );
    const egfr = kidney.find((m) => matchAny(m, ["egfr"], ["egfr", "gfr"]));
    const uric = kidney.find((m) => matchAny(m, ["uric"], ["uric"]));
    const whyHydration = [
      urea && "urea",
      creat && "creatinine",
      egfr && "eGFR",
      uric && "uric acid",
    ]
      .filter(Boolean)
      .join(", ");
    themes.push({
      id: "kidney",
      label: "Kidney-aware hydration",
      priority: kidney.some(
        (m) => m.status === "attention" || m.labStatus === "out_of_range",
      )
        ? "high"
        : "medium",
      breakfast: [
        opt(
          "Keep breakfast moderate in salt: eggs or yogurt with fruit, OR oats — skip salty processed meats",
          `A lower-sodium morning plate is a practical habit people discuss with ${whyHydration || "kidney markers"}`,
          cueAt(cs, 0),
        ),
      ],
      lunch: [
        opt(
          "Build lunch around vegetables, beans or fish, and water — go easy on salty deli meats and canned soups",
          `Plant-forward, lower-sodium lunches are commonly paired with ${whyHydration || "kidney-marker"} lifestyle context`,
          cueAt(cs, 1),
        ),
      ],
      dinner: [
        opt(
          "Cook at home when you can: grilled fish/tofu with steamed greens and rice — taste before adding salt",
          "Home cooking makes it easier to keep sodium modest while you watch kidney-related markers",
          cueAt(cs, 2),
        ),
      ],
      snack: [
        opt(
          "Choose fruit or plain yogurt; skip salty chips and energy drinks",
          uric
            ? "A simple snack swap that avoids salty ultra-processed options while you keep an eye on uric acid"
            : "A simple snack swap that avoids salty ultra-processed options",
          cueAt(cs, 0),
        ),
      ],
      habits: [
        opt(
          "Cook with herbs/lemon/pepper instead of reaching for the salt shaker at lunch and dinner",
          `Lower-sodium seasoning habits are commonly discussed with ${whyHydration || "kidney markers"} — hydration targets are in the water blocks above`,
          cueAt(cs, 1),
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
    const cs = cuesFor(iron);
    const lowish = iron.some(
      (m) =>
        m.status === "attention" ||
        m.status === "fair" ||
        (typeof m.value === "number" && m.value < 40 && m.id.includes("ferritin")),
    );
    const ferritin = iron.find((m) => m.id.includes("ferritin"));
    themes.push({
      id: "iron",
      label: "Iron-aware meals",
      priority: lowish ? "high" : "medium",
      breakfast: [
        opt(
          lowish
            ? "Include an iron-friendly breakfast: eggs with spinach/peppers, OR oatmeal with pumpkin seeds plus orange/kiwi"
            : "Keep breakfast balanced: oatmeal with seeds, OR yogurt with fruit",
          lowish
            ? `Pairing iron-containing foods with vitamin C is a common everyday approach${ferritin ? " when ferritin needs attention" : ""}`
            : "A steady breakfast while you keep an eye on iron-related markers",
          cueAt(cs, 0),
        ),
      ],
      lunch: [
        opt(
          lowish
            ? "Choose lean beef or lentil stew with broccoli, OR chickpea salad with citrus"
            : "Turkey/chicken wrap with greens, OR a bean bowl",
          lowish
            ? "Heme or plant iron options people often rotate into lunch"
            : "Steady protein at lunch alongside iron-aware habits",
          cueAt(cs, 1),
        ),
      ],
      dinner: [
        opt(
          lowish
            ? "Have chicken or lentils with red peppers, OR fish with greens and a citrus side"
            : "White fish or tofu with greens and peppers, OR a bean–veg plate",
          "Protein with vitamin C–rich sides is a practical dinner pattern for iron-related markers",
          cueAt(cs, 2),
        ),
      ],
      snack: [
        opt(
          lowish
            ? "Snack on pumpkin seeds or yogurt — leave tea/coffee for between meals, not with the snack"
            : "Yogurt with fruit, OR a small handful of nuts",
          "Simple snack timing that doesn’t fight iron absorption habits",
          cueAt(cs, 0),
        ),
      ],
      habits: [
        opt(
          "Drink tea/coffee at least 1 hour away from iron-rich meals",
          "Spacing drinks and meals is a concrete habit people discuss with ferritin / iron markers",
          cueAt(cs, 1),
        ),
      ],
    });
  }

  const inflammation = pool.filter((m) =>
    matchAny(m, ["crp", "esr", "homocysteine"], ["crp", "esr", "sed", "homocysteine"]),
  );
  if (inflammation.length) {
    const cs = cuesFor(inflammation);
    themes.push({
      id: "inflammation",
      label: "Recovery-minded day",
      priority: "medium",
      breakfast: [
        opt(
          "Eat colorful produce at breakfast: berries with yogurt, OR eggs with greens",
          "A produce-plus-protein start supports a recovery-minded day around CRP / inflammation markers",
          cueAt(cs, 0),
        ),
      ],
      lunch: [
        opt(
          "Choose salmon/sardines salad with olive oil, OR a chickpea–veg bowl",
          "Omega-3 or plant-forward lunches are common recovery-minded picks with inflammation markers",
          cueAt(cs, 1),
        ),
      ],
      dinner: [
        opt(
          "Cook a veg curry with chickpeas/tofu and rice, OR bake fish with broccoli/greens",
          "A vegetable-heavy dinner instead of fried takeout",
          cueAt(cs, 2),
        ),
      ],
      snack: [
        opt(
          "Swap fried snacks for berries/apple or a small handful of nuts",
          "A cleaner snack swap that is easy to repeat",
          cueAt(cs, 0),
        ),
      ],
      habits: [
        opt(
          "Be in bed aiming for 7–9 hours; screens dim at least 45 minutes before sleep",
          "Consistent sleep is a practical recovery habit alongside inflammation-related markers",
          cueAt(cs, 1),
        ),
      ],
    });
  }

  const liver = pool.filter((m) =>
    matchAny(m, ["alt", "ast", "ggt"], ["alt", "ast", "ggt", "transaminase"]),
  );
  if (liver.length) {
    const cs = cuesFor(liver);
    themes.push({
      id: "liver",
      label: "Lighter evenings",
      priority: "high",
      breakfast: [
        opt(
          "Keep breakfast simple: oats with fruit, OR yogurt with fruit",
          "An easy start while you keep evenings lighter around liver enzyme markers (ALT/AST/GGT)",
          cueAt(cs, 0),
        ),
      ],
      lunch: [
        opt(
          "Pick a lighter lunch: grilled fish/tofu bowl with salad — skip deep-fried sides",
          "A lighter midday plate is easier on an evening-focused routine for liver enzymes",
          cueAt(cs, 1),
        ),
      ],
      dinner: [
        opt(
          "Finish dinner by about 3 hours before bed: cod/tofu with steamed greens, OR a veg-heavy stir-fry with rice",
          "Earlier, lighter dinners are a concrete habit people often try with liver enzyme context",
          cueAt(cs, 2),
        ),
      ],
      snack: [
        opt(
          "Replace sugary drinks with sparkling water and lemon, OR herbal tea (2–3 cups max after noon)",
          "A simple drink swap that cuts liquid sugar",
          cueAt(cs, 0),
        ),
      ],
      habits: [
        opt(
          "Keep tonight alcohol-free (or discuss your usual weekly limit with your clinician)",
          "Alcohol load is commonly discussed alongside ALT / AST / GGT lifestyle context",
          cueAt(cs, 1),
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
    const cs = cuesFor(vitamins);
    const vitD = vitamins.find((m) => matchAny(m, ["vitamin-d"], ["vitamin d", "25(oh)"]));
    themes.push({
      id: "vitamins",
      label: "Nutrient-dense basics",
      priority: "medium",
      breakfast: [
        opt(
          "Include fortified yogurt or eggs with mushrooms, OR oats with seeds and fruit",
          vitD
            ? "Everyday foods people often use when vitamin D needs lifestyle support"
            : "Everyday foods people often use in nutrient-dense routines for vitamin markers",
          cueAt(cs, 0),
        ),
      ],
      lunch: [
        opt(
          "Add sardines/eggs on whole grain, OR a big leafy-green bowl with beans and olive oil",
          "Nutrient-dense proteins or greens at lunch for vitamin / folate context",
          cueAt(cs, 1),
        ),
      ],
      dinner: [
        opt(
          "Serve salmon/trout with quinoa/rice and spinach/kale, OR an egg–veg plate",
          "Oily fish or greens are practical dinner anchors for vitamin-related markers",
          cueAt(cs, 2),
        ),
      ],
      snack: [
        opt(
          "Have fortified plant milk/kefir or yogurt between meals if you need a snack",
          "A convenient fortified option between meals",
          cueAt(cs, 0),
        ),
      ],
      habits: [
        opt(
          "Get 10–20 minutes of outdoor daylight before noon when you can",
          vitD
            ? "A timed daylight habit commonly discussed with vitamin D lifestyle context"
            : "A timed daylight habit that pairs well with nutrient-dense routines",
          cueAt(cs, 1),
        ),
      ],
    });
  }

  const cortisol = pool.filter((m) =>
    matchAny(m, ["cortisol", "tsh"], ["cortisol", "tsh", "thyroid"]),
  );
  if (cortisol.length) {
    const cs = cuesFor(cortisol);
    themes.push({
      id: "rhythm",
      label: "Daily rhythm",
      priority: "medium",
      breakfast: [
        opt(
          "Eat a protein breakfast within about 60 minutes of waking (eggs, yogurt, or tofu with fruit)",
          "Regular morning fueling supports a steadier daily rhythm around cortisol / thyroid markers",
          cueAt(cs, 0),
        ),
      ],
      lunch: [
        opt(
          "Do not skip lunch: protein + produce + a whole grain portion",
          "A steady midday meal helps the afternoon feel more even",
          cueAt(cs, 1),
        ),
      ],
      dinner: [
        opt(
          "Finish dinner about 3 hours before bed when you can — keep it lighter than lunch",
          "Meal timing people often pair with better wind-down",
          cueAt(cs, 2),
        ),
      ],
      snack: [
        opt(
          "After 2pm, switch to herbal tea instead of coffee; fruit only if truly hungry",
          "Trimming late caffeine is a concrete wind-down step for rhythm-related markers",
          cueAt(cs, 0),
        ),
      ],
      habits: [
        opt(
          "Pick a consistent bedtime; do 5 minutes of breathwork or stretching before lights out",
          "Sleep regularity is a practical daily-rhythm habit with cortisol / TSH context",
          cueAt(cs, 1),
        ),
      ],
    });
  }

  if (themes.length === 0) {
    const refs = priorityMarkers(pool);
    const cs = cuesFor(refs);
    const hasKidneyOnPanel = markers.some(isKidneyMarker);
    const c0 = cueAt(cs, 0);
    themes.push({
      id: "maintenance",
      label: "Balanced maintenance",
      priority: "low",
      breakfast: [
        opt(
          "Eat eggs or Greek yogurt with fruit, OR toast with avocado and vegetables",
          "A protein-forward start that is easy to repeat while markers look broadly steady",
          c0,
        ),
      ],
      lunch: [
        opt(
          "Build a Mediterranean-style lunch: grain bowl with beans/greens/olive oil, OR fish with salad",
          "Flexible plates that stay satisfying without feeling strict",
          cueAt(cs, 1, c0),
        ),
      ],
      dinner: [
        opt(
          "Have fish or legumes with roasted vegetables, OR tofu stir-fry with rice",
          "A simple balanced dinner pattern for maintenance days",
          cueAt(cs, 2, c0),
        ),
      ],
      snack: [
        opt(
          "Choose fruit with a few nuts, OR yogurt — keep portions snack-sized",
          "Light, satisfying afternoon options",
          c0,
        ),
      ],
      habits: [
        opt(
          "Move for 20–30 minutes today (brisk walk, bike, or your preferred activity)",
          hasKidneyOnPanel
            ? "Daily activity supports overall marker maintenance, including kidney-related markers when present"
            : "Daily activity supports overall marker maintenance — consider adding urea and creatinine on a future panel for kidney context",
          c0,
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

type HydrationPlan = {
  wake: ActionPlanFoodItem;
  morning: ActionPlanFoodItem;
  dayFluid: ActionPlanFoodItem;
};

/**
 * Hydration is biomarker-aware when kidney markers are on the panel;
 * otherwise honest overall-health framing + nudge to get kidney markers.
 */
function buildHydrationItems(
  markers: ActionPlanMarkerInput[],
  flagged: ActionPlanMarkerInput[],
): HydrationPlan {
  const kidneyFlagged = rankMarkers(flagged.filter(isKidneyMarker));
  const kidneyOnPanel = markers.filter(isKidneyMarker);
  const primaryOther = rankMarkers(flagged).find((m) => !isKidneyMarker);

  if (kidneyFlagged.length > 0) {
    const names = kidneyFlagged
      .slice(0, 3)
      .map((m) => plainMarkerCue(m).replace(/^your\s+/i, ""))
      .join(", ");
    const c0 = cue(kidneyFlagged[0]!);
    return {
      wake: opt(
        "Drink 300–400 ml of water before coffee or tea",
        `Morning fluids are commonly discussed with ${names} — unless a clinician has fluid-restricted you`,
        c0,
      ),
      morning: opt(
        "Sip toward about 1 liter by lunchtime (roughly a glass every 60–90 minutes)",
        `Spreading water through the morning is a practical habit alongside ${names}`,
        cue(kidneyFlagged[1] ?? kidneyFlagged[0]!),
      ),
      dayFluid: opt(
        "Aim for about 2–2.5 liters of fluids across the whole day (more if you exercise or it’s hot), unless fluid-restricted",
        `A concrete daily fluid target people often track with kidney-related markers (${names})`,
        c0,
      ),
    };
  }

  if (kidneyOnPanel.length > 0) {
    const steady = rankMarkers(kidneyOnPanel)[0]!;
    const c0 = cue(steady);
    const statusPhrases = kidneyOnPanel
      .slice(0, 3)
      .map((m) => plainMarkerCue(m))
      .join(", ");
    return {
      wake: opt(
        "Drink 300–400 ml of water before coffee or tea",
        `Morning fluids pair with ${statusPhrases} — a lifestyle habit, not a diagnosis`,
        c0,
      ),
      morning: opt(
        "Sip toward about 1 liter by lunchtime (roughly a glass every 60–90 minutes)",
        `Steady sipping is commonly discussed alongside ${statusPhrases}`,
        cue(kidneyOnPanel[1] ?? steady),
      ),
      dayFluid: opt(
        "Aim for about 2–2.5 liters of fluids across the whole day (more if you exercise or it’s hot)",
        `A concrete fluid target while tracking ${statusPhrases}`,
        c0,
      ),
    };
  }

  // No kidney markers on this panel — still recommend hydration, but be honest.
  const fallbackCue = primaryOther
    ? cue(primaryOther)
    : undefined;
  return {
    wake: opt(
      "Drink 300–400 ml of water before coffee or tea",
      "Hydration supports overall day-to-day health; this panel doesn’t include kidney markers (urea, creatinine, eGFR) — worth adding on a future draw",
      fallbackCue,
    ),
    morning: opt(
      "Sip toward about 1 liter by lunchtime (roughly a glass every 60–90 minutes)",
      "Spreading water through the morning beats one late chug — useful generally, and especially relevant if you later track kidney markers",
      fallbackCue,
    ),
    dayFluid: opt(
      "Aim for about 2–2.5 liters of fluids across the whole day (more if you exercise or it’s hot)",
      "A concrete daily fluid target for overall health; consider asking your clinician about urea and creatinine if kidney context is missing",
      fallbackCue,
    ),
  };
}

/**
 * Deterministic, biomarker-driven daily routine seed.
 * Same flagged marker set → same seed. Different flagged themes/markers →
 * different meals, habits, hydration framing, and cue strings.
 * Actions are specific; marker fields are plain-language hover cues (no lab values).
 */
export function buildPersonalizedActionPlan(
  input: ActionPlanRequestBody,
): ActionPlanResult {
  const themes = themeForMarkers(input.markers);
  const top = themes.slice(0, 3);
  const focus = top.map((t) => t.label);

  const flagged = rankMarkers(input.markers.filter(needsAttention));
  const hydration = buildHydrationItems(input.markers, flagged);
  const summary =
    flagged.length > 0
      ? `Today’s plan focuses on ${flagged
          .slice(0, 3)
          .map((m) => plainMarkerCue(m))
          .join(", ")}${flagged.length > 3 ? ", and related markers" : ""}. Discuss lasting changes with your clinician.`
      : `Markers look broadly steady for a ${input.demographic.sex}, age ${input.demographic.ageYears} profile — a balanced maintenance routine to discuss with your clinician as needed.`;

  const windDownCue =
    flagged[0] != null
      ? cue(flagged[0])
      : top[0]?.habits[0]?.marker;

  const routine: ActionPlanBlock[] = [
    {
      time: "7:00",
      title: "Wake / hydration",
      items: [hydration.wake],
    },
    {
      time: "7:15–7:30",
      title: "Light movement + daylight",
      items: [
        opt(
          "Spend 10–15 minutes outside or by a bright window with easy mobility/stretching",
          top.some((t) => t.id === "vitamins")
            ? "Short morning daylight and movement help set the day’s rhythm — often discussed with vitamin D"
            : "Short morning daylight and movement help set the day’s rhythm",
          top[0]?.habits[0]?.marker ?? (flagged[0] ? cue(flagged[0]) : undefined),
        ),
      ],
    },
    {
      time: "7:30–8:30",
      title: "Breakfast",
      items: pickItems(top, "breakfast", 2),
    },
    {
      time: "8:30–12:30",
      title: "Morning hydration",
      items: [hydration.morning],
    },
    {
      time: "12:30–13:30",
      title: "Lunch",
      items: pickItems(top, "lunch", 2),
      note: "If you want something sweet after, fruit is usually enough",
    },
    {
      time: "15:30–16:30",
      title: "Optional snack",
      items: pickItems(top, "snack", 2),
    },
    {
      time: "19:00–20:00",
      title: "Dinner",
      items: pickItems(top, "dinner", 2),
    },
    {
      time: "Day",
      title: "Key habits",
      items: [...pickItems(top, "habits", 2), hydration.dayFluid].slice(0, 3),
    },
    {
      time: "22:00",
      title: "Wind-down",
      items: [
        opt(
          "Screens down by 22:00; 5–10 minutes of stretch, reading, or breathwork before sleep",
          top.some((t) => t.id === "inflammation" || t.id === "rhythm")
            ? "Protecting sleep makes tomorrow’s routine easier — especially with inflammation or rhythm markers in focus"
            : "Protecting sleep makes tomorrow’s routine easier to keep",
          windDownCue,
        ),
      ],
    },
  ].filter((b) => b.items.length > 0);

  return { summary, routine, focus };
}
