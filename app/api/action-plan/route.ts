import { requireUser } from "@/lib/auth/session";
import {
  alignActionPlanCues,
  generateActionPlanWithGroq,
  type ActionPlanRequestBody,
} from "@/lib/report/action-plan";
import { buildPersonalizedActionPlan } from "@/lib/report/action-plan-builder";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Lifestyle-only action plan.
 * Prefers a Groq rewrite of the biomarker-aware seed; ships the seed when
 * Groq is missing, errors, or produces glued/one-marker copy.
 * Educational suggestions — not medical advice / diagnosis.
 */
export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ActionPlanRequestBody;
  try {
    body = (await request.json()) as ActionPlanRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !body?.demographic ||
    typeof body.demographic.ageYears !== "number" ||
    !body.demographic.sex ||
    !Array.isArray(body.markers) ||
    body.markers.length === 0
  ) {
    return NextResponse.json(
      { error: "demographic and markers are required" },
      { status: 400 },
    );
  }

  const markers = body.markers.slice(0, 40).map((m) => ({
    id: String(m.id ?? ""),
    name: String(m.name ?? "Marker"),
    section: String(m.section ?? "Other"),
    value: typeof m.value === "number" ? m.value : null,
    valueDisplay:
      typeof m.valueDisplay === "string" ? m.valueDisplay : undefined,
    unit: String(m.unit ?? ""),
    status: m.status == null ? null : String(m.status),
    labStatus: String(m.labStatus ?? "unknown"),
  }));

  const input = { demographic: body.demographic, markers };
  const seed = alignActionPlanCues(buildPersonalizedActionPlan(input), markers);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ plan: seed, source: "seed" });
  }

  try {
    const plan = await generateActionPlanWithGroq(input, apiKey, seed);
    return NextResponse.json({ plan, source: "groq" });
  } catch (err) {
    console.error(
      "[action-plan] Groq failed; using seed",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json({ plan: seed, source: "seed" });
  }
}
