import {
  extractJsonText,
  groqJsonChatBody,
  readGroqJsonText,
} from "@/lib/ai/groq";
import {
  cueHasStatusDetail,
  foodLooksGlued,
  givenMarkerPhrase,
  isVagueMarkerCue,
  plainMarkerCue,
  priorityMarkers,
  resolveCanonicalMarkerCue,
  splitGluedMarkerCue,
  stripGivenClauseFromFood,
  stripLabValues,
} from "@/lib/report/action-plan-language";
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
  /** Specific action the user can do (amounts / times when useful) */
  food: string;
  /** Hover tip explaining why — plain language, no diagnosis, no lab numbers */
  why: string;
  /** Hoverable plain-language cue, e.g. "given your higher LDL cholesterol" */
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

/** @deprecated Prefer plainMarkerCue / givenMarkerPhrase — kept for older UI paths */
export function formatMarkerRef(m: ActionPlanMarkerInput): string {
  return plainMarkerCue(m);
}

const SYSTEM_PROMPT = `You are a lifestyle coach for Blood Analyzer (educational blood-test reports).

Audience: non-scientific adults. Write like a clear personal trainer / health coach — concrete and kind.

Hard rules:
- NEVER diagnose or claim the user has a disease ("you have diabetes", "you have high cholesterol disease").
- NEVER recommend starting/stopping prescription medication or supplements as treatment.
- Suggest ONLY general lifestyle ideas (meals, movement, sleep, daylight, stress, hydration).
- NEVER include exact lab numbers, units, or phrases like "56 mg/dL" anywhere in the JSON.
- Respond with JSON only.

Action style (critical):
- Each item "food" is ONE clear action the user can do today.
- Prefer specifics: minutes of exercise, time of day, liters/glasses of water, meal patterns with flexible swaps.
- Good: "Walk briskly for 25–30 minutes within an hour after lunch"
- Good: "Drink about 2–2.5 liters of water across the day (a glass with each meal and between)"
- Good: "Build breakfast around protein + fiber: Greek yogurt with berries, OR eggs with avocado toast"
- Bad: vague "eat healthy" / "stay active" / chef-precise recipes with no times
- Bad: stuffing the marker cue into food ("…coffee — given your out-of-range Estradiol…")

Marker language (critical):
- Copy each item's "marker" from the seed, OR pick from the cue list in the user message. Do not invent new cue wording.
- EVERY cue MUST include a grade or direction word: higher, lower, optimal, good, above-optimal, below-optimal, running high, running low.
- Good: "given your higher creatinine", "given your above-optimal urea"
- Bad: "given your creatinine" (missing higher/lower/optimal/good)
- Bad: concatenating the name twice ("given your out-of-range EstradiolEstradiol is out-of-range")
- ALWAYS name a specific biomarker. FORBIDDEN vague cues: "overall nutritional balance", "overall health", "wellness".
- "why" is a SEPARATE field (never glued onto "marker").
- Rotate cues across the day when 2+ priority markers exist. NEVER hang every line on one marker (e.g. estradiol on water, breakfast, lunch, snack, dinner, and sleep).
- Hydration (water / liters) must NOT use sex-hormone cues. Tie water to urea / creatinine / eGFR when present; otherwise omit "marker" on water lines.
- Hormone-flagged panels: vary meals, movement, sleep, and protein. Do not claim water "balances estradiol".

Sentence shape:
- Rendered UI is: "{food} — {marker}" with marker hover showing "why".
- So "food" must stand alone as the action; "marker" is only the "given your …" cue; "why" is only the tooltip.
- Do NOT put marker or why words inside "food". Do NOT concatenate marker + why.`;

export function buildActionPlanUserPrompt(
  input: ActionPlanRequestBody,
  seed: ActionPlanResult,
): string {
  const priority = priorityMarkers(input.markers).filter(
    (m) =>
      m.status === "attention" ||
      m.status === "fair" ||
      m.labStatus === "out_of_range",
  );

  const priorityLines = priority.map((m) => {
    return `- ${m.name} (${m.id}): grade=${m.status ?? "ungraded"}; lab=${m.labStatus}; cue="${givenMarkerPhrase(m)}"`;
  });

  const others = input.markers
    .filter(
      (m) =>
        m.status !== "attention" &&
        m.status !== "fair" &&
        m.labStatus !== "out_of_range",
    )
    .slice(0, 12)
    .map((m) => `- ${m.name}: grade=${m.status ?? "ungraded"}`);

  return `Demographic: ${input.demographic.sex}, age ${input.demographic.ageYears}.

Priority markers (use these exact "cue" strings as item "marker" fields — do NOT add numbers):
${
    priorityLines.length
      ? priorityLines.join("\n")
      : "(none flagged — maintenance mode; still name real markers from the panel in cues, e.g. given your hemoglobin / given your creatinine — never \"overall nutritional balance\")"
  }

Other markers (context only):
${others.join("\n") || "(none)"}

Rewrite the seed into a DISTINCT daily routine tailored to THIS user's flagged markers:
- Rewrite food actions so they stay specific, but KEEP each seed item's "marker" unless you are rotating among the cue list.
- Different users with different flagged markers must get different meals/habits — do not emit a generic one-size-fits-all plan.
- Keep timeline: wake → movement → breakfast → hydration → lunch → snack → dinner → habits → wind-down.
- Every item "food" is a specific action (minutes, liters/glasses, meal pattern with / or OR swaps) with NO "given your" text inside it.
- Rotate cues across items when multiple priority markers exist (do not hang every line on one marker).
- Hydration lines: no sex-hormone marker field.
- summary: 1–2 sentences naming the focus biomarkers with grade words — NO lab values.
- focus: up to 3 short coach-style labels without values.

Schema:
{
  "summary": "Plain-language focus for today — no lab numbers, no diagnosis",
  "routine": [
    {
      "time": "12:30–13:00",
      "title": "After-lunch walk",
      "items": [{
        "food": "Walk briskly for 25–30 minutes",
        "marker": "given your higher LDL cholesterol",
        "why": "A short post-meal walk is a simple habit people often use to support heart-friendly lipids"
      }]
    }
  ],
  "focus": ["Post-meal walks", "Fiber-forward plates"]
}

Seed (structure only — rewrite actions; do not copy food lists verbatim):
${JSON.stringify(seed)}`;
}

function asFoodItems(raw: unknown): ActionPlanFoodItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") {
        return {
          food: stripGivenClauseFromFood(stripLabValues(item.trim())),
          why: "",
        };
      }
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const food = stripGivenClauseFromFood(
          stripLabValues(String(o.food ?? o.text ?? "").trim()),
        );
        const why = stripLabValues(String(o.why ?? o.reason ?? "").trim());
        const markerRaw = o.marker ?? o.markerRef ?? o.linkedMarker;
        const marker =
          typeof markerRaw === "string" && markerRaw.trim()
            ? stripLabValues(markerRaw.trim())
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
      items: [{ food: "Drink a full glass of water (about 250 ml)", why: "Start hydrated" }],
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
  const cleaned = extractJsonText(raw);
  const parsed = JSON.parse(cleaned) as Partial<ActionPlanResult>;

  if (!parsed || typeof parsed.summary !== "string") {
    throw new Error("Invalid action plan shape");
  }

  let routine: ActionPlanBlock[] = [];
  if (Array.isArray(parsed.routine) && parsed.routine.length > 0) {
    routine = parsed.routine
      .map((block): ActionPlanBlock | null => {
        if (!block || typeof block !== "object") return null;
        const b = block as Partial<ActionPlanBlock>;
        const time = String(b.time ?? "").trim();
        const title = String(b.title ?? "").trim();
        const items = asFoodItems(b.items);
        if (!time || !title || items.length === 0) return null;
        const note =
          typeof b.note === "string" && b.note.trim()
            ? stripLabValues(b.note.trim())
            : undefined;
        return note ? { time, title, items, note } : { time, title, items };
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
    ? parsed.focus
        .map((f) => stripLabValues(String(f).trim()))
        .filter(Boolean)
        .slice(0, 4)
    : [];

  return {
    summary: stripLabValues(parsed.summary.trim()),
    routine,
    focus,
  };
}

/**
 * Re-attach status-specific cues after the model rewrite so we never ship
 * bare "given your creatinine" or glued marker+why strings.
 */
export function alignActionPlanCues(
  plan: ActionPlanResult,
  markers: ActionPlanMarkerInput[],
): ActionPlanResult {
  const routine = plan.routine.map((block) => ({
    ...block,
    items: block.items.map((item) => {
      let food = stripGivenClauseFromFood(stripLabValues(item.food));
      let marker = item.marker ? stripLabValues(item.marker) : undefined;
      let why = item.why ? stripLabValues(item.why) : "";

      if (marker) {
        const split = splitGluedMarkerCue(marker);
        marker = split.marker;
        if (split.spilledWhy && !why) why = split.spilledWhy;
      }

      if (!marker || isVagueMarkerCue(marker) || !cueHasStatusDetail(marker)) {
        marker = resolveCanonicalMarkerCue(marker ?? why, markers);
      } else {
        const canonical = resolveCanonicalMarkerCue(marker, markers);
        if (canonical && cueHasStatusDetail(canonical)) marker = canonical;
      }

      if (marker && (!why || !cueHasStatusDetail(why))) {
        const plain = marker.replace(/^given\s+/i, "");
        why = `Lifestyle habit paired with ${plain} — discuss lasting changes with your clinician, not a diagnosis.`;
      }

      return { ...item, food, marker, why };
    }),
  }));

  let summary = plan.summary;
  if (isVagueMarkerCue(summary) || !cueHasStatusDetail(summary)) {
    const top = priorityMarkers(markers).slice(0, 3);
    if (top.length) {
      summary = `Today’s plan focuses on ${top.map((m) => plainMarkerCue(m)).join(", ")}. Discuss lasting changes with your clinician.`;
    }
  }

  return { ...plan, summary, routine };
}

/** True when Groq output is still collapsed onto one marker or glued together. */
export function actionPlanFailsQuality(
  plan: ActionPlanResult,
  markers: ActionPlanMarkerInput[],
): boolean {
  const items = plan.routine.flatMap((b) => b.items);
  if (items.some((i) => foodLooksGlued(i.food))) return true;
  if (items.some((i) => i.marker && /([A-Za-z]{4,})\1/.test(i.marker))) {
    return true;
  }

  const flagged = priorityMarkers(markers).filter(
    (m) =>
      m.status === "attention" ||
      m.status === "fair" ||
      m.labStatus === "out_of_range",
  );
  if (flagged.length < 2) return false;

  const cueNames = items
    .map((i) => i.marker?.toLowerCase() ?? "")
    .filter((m) => m.startsWith("given "));
  if (cueNames.length < 3) return false;
  const unique = new Set(cueNames);
  return unique.size < 2;
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
      body: JSON.stringify(
        groqJsonChatBody({
          system: SYSTEM_PROMPT,
          user: buildActionPlanUserPrompt(input, seed),
          temperature: 0.4,
        }),
      ),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Groq request failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
    );
  }

  const data: unknown = await response.json();
  const rewritten = alignActionPlanCues(
    parseActionPlanJson(readGroqJsonText(data)),
    input.markers,
  );
  if (actionPlanFailsQuality(rewritten, input.markers)) {
    return alignActionPlanCues(seed, input.markers);
  }
  return rewritten;
}
