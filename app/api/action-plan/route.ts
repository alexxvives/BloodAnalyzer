import { requireUser } from "@/lib/auth/session";
import {
  generateActionPlanWithGroq,
  type ActionPlanRequestBody,
} from "@/lib/report/action-plan";
import { buildPersonalizedActionPlan } from "@/lib/report/action-plan-builder";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Lifestyle-only action plan via Groq.
 * Requires GROQ_API_KEY — no seed/fallback plan when the model is unavailable.
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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Action plan unavailable — Groq is not configured. Set GROQ_API_KEY to enable personalized routines.",
      },
      { status: 503 },
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
  const seed = buildPersonalizedActionPlan(input);

  try {
    const plan = await generateActionPlanWithGroq(input, apiKey, seed);
    return NextResponse.json({ plan, source: "groq" });
  } catch (err) {
    console.error(
      "[action-plan] Groq failed",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      {
        error:
          "Action plan unavailable — the AI routine generator failed. Try again in a moment.",
      },
      { status: 502 },
    );
  }
}
