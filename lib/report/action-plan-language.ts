import type { ActionPlanMarkerInput } from "@/lib/report/action-plan";

/**
 * Markers where lower optimization grades usually mean the value is
 * running high (more of the analyte is the concern).
 */
const HIGHER_IS_CONCERN = [
  "ldl",
  "non-hdl",
  "total-cholesterol",
  "triglyceride",
  "glucose",
  "hba1c",
  "insulin",
  "crp",
  "esr",
  "homocysteine",
  "alt",
  "ast",
  "ggt",
  "urea",
  "bun",
  "creatinine",
  "uric",
  "lp-a",
  "cortisol",
];

/**
 * Markers where lower optimization grades usually mean the value is
 * running low (not enough of a protective / nutrient marker).
 */
const LOWER_IS_CONCERN = [
  "hdl",
  "egfr",
  "vitamin-d",
  "vitamin-b12",
  "folate",
  "ferritin",
  "iron",
  "transferrin",
  "hemoglobin",
  "hematocrit",
];

const STATUS_WORDS =
  /\b(higher|lower|optimal|good|fair|above-optimal|below-optimal|out-of-range|running high|running low|needing attention|sitting below)\b/i;

const VAGUE_CUE =
  /\b(overall\s+(nutritional\s+)?balance|overall\s+health|overall\s+markers|wellness)\b/i;

function friendlyName(m: ActionPlanMarkerInput): string {
  const id = m.id.toLowerCase();
  const name = m.name.trim();
  if (id.includes("ldl") && id.includes("hdl")) return "LDL to HDL ratio";
  if (id.includes("ldl") && id.includes("apo")) return "LDL to ApoB ratio";
  if (id.includes("tg-hdl") || (id.includes("triglyceride") && id.includes("hdl"))) {
    return "triglycerides to HDL ratio";
  }
  if (id.includes("tc-hdl") || (id.includes("total-cholesterol") && id.includes("hdl"))) {
    return "total cholesterol to HDL ratio";
  }
  if (id.includes("ldl")) return "LDL cholesterol";
  if (id.includes("hdl")) return "HDL cholesterol";
  if (id.includes("triglyceride")) return "triglycerides";
  if (id.includes("total-cholesterol")) return "total cholesterol";
  if (id.includes("glucose")) return "fasting glucose";
  if (id.includes("hba1c")) return "A1C";
  if (id.includes("egfr")) return "eGFR";
  if (id.includes("urea") || id === "bun") return "urea";
  if (id.includes("creatinine")) return "creatinine";
  if (id.includes("uric")) return "uric acid";
  if (id.includes("vitamin-d")) return "vitamin D";
  if (id.includes("vitamin-b12") || id.includes("b12")) return "vitamin B12";
  if (id.includes("free-testosterone")) return "free testosterone";
  if (id.includes("estradiol")) return "estradiol";
  if (id.includes("testosterone")) return "testosterone";
  if (id.includes("lp-a") || name.toLowerCase().includes("lp(a)")) {
    return "Lp(a)";
  }
  // Drop redundant "Cholesterol" duplication noise from lab names when useful
  return name.replace(/\s+/g, " ");
}

function concernDirection(
  m: ActionPlanMarkerInput,
): "high" | "low" | "mixed" {
  const id = m.id.toLowerCase();
  const name = m.name.toLowerCase();
  const blob = `${id} ${name}`;
  if (HIGHER_IS_CONCERN.some((k) => blob.includes(k))) return "high";
  if (LOWER_IS_CONCERN.some((k) => blob.includes(k))) return "low";
  return "mixed";
}

function needsPlainCue(m: ActionPlanMarkerInput): boolean {
  return (
    m.status === "attention" ||
    m.status === "fair" ||
    m.labStatus === "out_of_range"
  );
}

/**
 * Short plain-language cue for non-scientists — never includes the numeric value.
 * Always states direction or grade (higher / lower / optimal / good / fair).
 */
export function plainMarkerCue(m: ActionPlanMarkerInput): string {
  const name = friendlyName(m);
  const direction = concernDirection(m);

  if (m.labStatus === "out_of_range") {
    if (direction === "high") return `your higher ${name}`;
    if (direction === "low") return `your lower ${name}`;
    return `your out-of-range ${name}`;
  }

  if (m.status === "attention") {
    if (direction === "high") return `your ${name} running high`;
    if (direction === "low") return `your ${name} running low`;
    return `your ${name} needing attention`;
  }

  if (m.status === "fair") {
    if (direction === "high") return `your above-optimal ${name}`;
    if (direction === "low") return `your below-optimal ${name}`;
    return `your ${name} sitting below optimal`;
  }

  if (m.status === "optimal") {
    return `your optimal ${name}`;
  }

  if (m.status === "good") {
    return `your ${name} in a good range`;
  }

  // Ungraded / unknown — still name the marker; avoid bare "your creatinine"
  if (direction === "high") return `your ${name} (watch for higher levels)`;
  if (direction === "low") return `your ${name} (watch for lower levels)`;
  return `your ${name} on this panel`;
}

/** Hover phrase used after an action, e.g. "given your higher LDL cholesterol" */
export function givenMarkerPhrase(m: ActionPlanMarkerInput): string {
  return `given ${plainMarkerCue(m)}`;
}

/** True when a cue already names a grade/direction (not a bare marker name). */
export function cueHasStatusDetail(cue: string): boolean {
  return STATUS_WORDS.test(cue) && !VAGUE_CUE.test(cue);
}

export function isVagueMarkerCue(cue: string): boolean {
  return VAGUE_CUE.test(cue) || !cueHasStatusDetail(cue);
}

/**
 * Groq sometimes glues the why sentence onto the marker cue
 * ("given your creatinineMorning hydration…") or concatenates the
 * marker name twice ("EstradiolEstradiol is out-of-range…").
 */
export function splitGluedMarkerCue(raw: string): {
  marker: string;
  spilledWhy?: string;
} {
  const trimmed = raw.trim();

  const duplicatedName = trimmed.match(
    /^(given\s+your\s+.+?\b)([A-Za-z][A-Za-z0-9().%-]{2,})\2\b([\s\S]*)$/,
  );
  if (duplicatedName) {
    const marker = `${duplicatedName[1]}${duplicatedName[2]}`.trim();
    const spilled = duplicatedName[3]?.trim();
    return spilled ? { marker, spilledWhy: spilled } : { marker };
  }

  const glued = trimmed.match(
    /^(given\s+your\s+.+?)([A-Z][a-z].{12,})$/,
  );
  if (glued) {
    return { marker: glued[1]!.trim(), spilledWhy: glued[2]!.trim() };
  }
  return { marker: trimmed };
}

/** Model often stuffs " — given your …" into the action text. */
export function stripGivenClauseFromFood(food: string): string {
  return food
    .replace(/\s*[—–-]\s*given\s+your\b[\s\S]*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function foodLooksGlued(food: string): boolean {
  return /\bgiven\s+your\b/i.test(food) || /([A-Za-z]{4,})\1/i.test(food);
}

/** Pick the best canonical cue for a free-text marker label. */
export function resolveCanonicalMarkerCue(
  label: string,
  markers: ActionPlanMarkerInput[],
): string | undefined {
  const lower = label.toLowerCase();
  const pool = priorityMarkers(markers);

  for (const m of pool) {
    const given = givenMarkerPhrase(m).toLowerCase();
    const plain = plainMarkerCue(m).toLowerCase();
    if (lower === given || lower === plain) return givenMarkerPhrase(m);
  }

  for (const m of pool) {
    const name = friendlyName(m).toLowerCase();
    if (lower.includes(name) || lower.includes(m.name.toLowerCase())) {
      return givenMarkerPhrase(m);
    }
  }

  return pool[0] ? givenMarkerPhrase(pool[0]) : undefined;
}

/** Strip accidental lab values from model output (mg/dL, %, etc.). */
export function stripLabValues(text: string): string {
  return text
    .replace(
      /\b\d+(?:[.,]\d+)?\s*(mg\/dL|g\/dL|ng\/mL|pg\/mL|ug\/dL|µg\/dL|U\/L|IU\/L|mmol\/L|µmol\/L|umol\/L|mm\/h|fL|%|g\/L)\b/gi,
      "",
    )
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

export function priorityMarkers(
  markers: ActionPlanMarkerInput[],
): ActionPlanMarkerInput[] {
  const flagged = markers.filter(needsPlainCue);
  return flagged.length > 0 ? flagged : markers.slice(0, 3);
}
