import type { Demographic } from "@/lib/types";

export type ActionPlanMarkerInput = {
  id: string;
  name: string;
  section: string;
  value: number | null;
  valueDisplay?: string;
  unit: string;
  status: string | null;
  labStatus: string;
};

export type ActionPlanFoodItem = {
  /** Meal/habit options — use / and OR for alternatives, not one fixed plate */
  food: string;
  /** Shown only when hovering the linked marker word */
  why: string;
  /** Hoverable marker cite, e.g. "LDL 160 mg/dL" */
  marker?: string;
};

export type ActionPlanBlock = {
  time: string;
  title: string;
  items: ActionPlanFoodItem[];
  note?: string;
};

export type ActionPlanResult = {
  summary: string;
  routine: ActionPlanBlock[];
  focus: string[];
  /** @deprecated kept for older cached responses */
  meals?: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  habits?: string[];
};

export type ActionPlanRequestBody = {
  demographic: Demographic;
  markers: ActionPlanMarkerInput[];
};

/** e.g. "LDL 160 mg/dL" — cites this report's measured value */
export function formatMarkerRef(m: ActionPlanMarkerInput): string {
  const value =
    m.valueDisplay?.trim() ||
    (typeof m.value === "number" && Number.isFinite(m.value)
      ? String(m.value)
      : "");
  if (!value) return m.name;
  const unit = m.unit?.trim();
  return unit ? `${m.name} ${value} ${unit}` : `${m.name} ${value}`;
}

const SYSTEM_PROMPT = `You are a lifestyle coach for Blood Analyzer (educational blood-test reports).

Hard rules:
- NEVER diagnose or claim the user has a disease.
- NEVER recommend starting/stopping prescription medication or supplements as treatment.
- Suggest ONLY general lifestyle ideas (meals, movement, sleep, daylight, stress) people commonly discuss with clinicians.
- Respond with JSON only.

Food style (critical):
- Do NOT lock the user into one rigid plate. Every meal "food" string MUST offer choices.
- Use slash lists for swaps: "berries/apple/pear", "salmon/sardines/mackerel", "quinoa/brown rice".
- Offer 2 plate options with OR when helpful: "Greek yogurt + berries/apple OR eggs + spinach/peppers".
- Keep amounts light/approximate only when useful; prefer flexible wording over a chef recipe.
- Bad: "150g baked salmon + ¾ cup quinoa + roasted Brussels sprouts"
- Good: "Salmon/sardines/trout with quinoa/brown rice and greens · or · lentil bowl with olive oil"

Marker links (critical):
- Each item MUST include "marker": a priority marker WITH value + unit from the user's list (e.g. "LDL 160 mg/dL").
- "why" is short tooltip text for that marker word only (1 sentence, no diagnosis).
- Summary MUST name at least one priority marker with its value + unit.
- Prioritize fair/attention/out-of-range markers.
- Invent a fresh menu from the marker priorities — never copy a canned template.`;

export function buildActionPlanUserPrompt(
  input: ActionPlanRequestBody,
  seed: ActionPlanResult,
): string {
  const priority = input.markers
    .filter(
      (m) =>
        m.status === "attention" ||
        m.status === "fair" ||
        m.labStatus === "out_of_range",
    )
    .map((m) => {
      const value =
        m.valueDisplay ?? (m.value == null ? "n/a" : String(m.value));
      return `- PRIORITY ${m.name}: ${value} ${m.unit}; grade=${m.status ?? "ungraded"}; lab=${m.labStatus}`;
    });

  const others = input.markers
    .filter(
      (m) =>
        m.status !== "attention" &&
        m.status !== "fair" &&
        m.labStatus !== "out_of_range",
    )
    .slice(0, 12)
    .map((m) => {
      const value =
        m.valueDisplay ?? (m.value == null ? "n/a" : String(m.value));
      return `- ${m.name}: ${value} ${m.unit}; grade=${m.status ?? "ungraded"}`;
    });

  return `Demographic: ${input.demographic.sex}, age ${input.demographic.ageYears}.

Priority markers (drive the plan — cite these EXACT value strings in "marker" fields):
${priority.length ? priority.join("\n") : "(none flagged — maintenance mode)"}

Other markers:
${others.join("\n") || "(none)"}

Rewrite the seed into a DISTINCT daily routine:
- Keep timeline: wake → movement → breakfast → hydration → lunch → snack → dinner → habits → wind-down.
- Every "food" offers alternatives with / and/or OR (not one fixed combination).
- Every item has "marker" (Name Value Unit from priority list when any exist) and a short "why" for that hover word.
- summary cites priority markers with values; focus: up to 3 short labels.

Schema:
{
  "summary": "1-2 sentences citing priority markers with values, no diagnosis",
  "routine": [
    {
      "time": "7:30–8:30",
      "title": "Breakfast",
      "items": [{
        "food": "Greek yogurt + berries/apple OR eggs + spinach/peppers",
        "marker": "LDL 160 mg/dL",
        "why": "Fiber + protein pattern commonly discussed with this lipid result"
      }],
      "note": "optional"
    }
  ],
  "focus": ["label 1", "label 2"]
}

Seed (structure only — rewrite foods; do not copy food lists):
${JSON.stringify(seed)}`;
}

function asFoodItems(raw: unknown): ActionPlanFoodItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") {
        return { food: item.trim(), why: "" };
      }
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const food = String(o.food ?? o.text ?? "").trim();
        const why = String(o.why ?? o.reason ?? "").trim();
        const markerRaw = o.marker ?? o.markerRef ?? o.linkedMarker;
        const marker =
          typeof markerRaw === "string" && markerRaw.trim()
            ? markerRaw.trim()
            : undefined;
        if (!food) return null;
        return { food, why, marker };
      }
      return null;
    })
    .filter((x): x is ActionPlanFoodItem => x != null)
    .slice(0, 8);
}

function normalizeFromLegacy(parsed: Partial<ActionPlanResult>): ActionPlanBlock[] {
  const meals = parsed.meals;
  const habits = Array.isArray(parsed.habits) ? parsed.habits : [];
  if (!meals) return [];
  const blocks: ActionPlanBlock[] = [
    {
      time: "7:00",
      title: "Wake",
      items: [{ food: "Water / herbal tea", why: "Start hydrated" }],
    },
    {
      time: "7:30–8:30",
      title: "Breakfast",
      items: [{ food: meals.breakfast, why: "" }],
    },
    {
      time: "12:30–13:30",
      title: "Lunch",
      items: [{ food: meals.lunch, why: "" }],
    },
    {
      time: "19:00–20:00",
      title: "Dinner",
      items: [{ food: meals.dinner, why: "" }],
    },
  ];
  if (habits.length) {
    blocks.push({
      time: "Day",
      title: "Habits",
      items: habits.map((h) => ({ food: String(h), why: "" })),
    });
  }
  return blocks;
}

export function parseActionPlanJson(raw: string): ActionPlanResult {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  const parsed = JSON.parse(cleaned) as Partial<ActionPlanResult>;

  if (!parsed || typeof parsed.summary !== "string") {
    throw new Error("Invalid action plan shape");
  }

  let routine: ActionPlanBlock[] = [];
  if (Array.isArray(parsed.routine) && parsed.routine.length > 0) {
    routine = parsed.routine
      .map((block) => {
        if (!block || typeof block !== "object") return null;
        const b = block as Partial<ActionPlanBlock>;
        const time = String(b.time ?? "").trim();
        const title = String(b.title ?? "").trim();
        const items = asFoodItems(b.items);
        if (!time || !title || items.length === 0) return null;
        const note =
          typeof b.note === "string" && b.note.trim() ? b.note.trim() : undefined;
        return { time, title, items, note };
      })
      .filter((x): x is ActionPlanBlock => x != null)
      .slice(0, 12);
  } else {
    routine = normalizeFromLegacy(parsed);
  }

  if (routine.length === 0) {
    throw new Error("Invalid action plan shape");
  }

  const focus = Array.isArray(parsed.focus)
    ? parsed.focus.map((f) => String(f).trim()).filter(Boolean).slice(0, 4)
    : [];

  return {
    summary: parsed.summary.trim(),
    routine,
    focus,
  };
}

export { SYSTEM_PROMPT };

export async function generateActionPlanWithGroq(
  input: ActionPlanRequestBody,
  apiKey: string,
  seed: ActionPlanResult,
): Promise<ActionPlanResult> {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildActionPlanUserPrompt(input, seed) },
        ],
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Groq request failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty Groq response");
  return parseActionPlanJson(content);
}
