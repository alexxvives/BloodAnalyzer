import { requireUser } from "@/lib/auth/session";
import type { ExtractedMarker } from "@/lib/extraction/types";
import { buildReportViewModel } from "@/lib/report/report-dto";
import type { Demographic, DemographicSex } from "@/lib/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function parseDemographic(raw: unknown): Demographic | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as { sex?: unknown; ageYears?: unknown };
  const sex = d.sex;
  if (sex !== "male" && sex !== "female" && sex !== "other") return null;
  if (typeof d.ageYears !== "number" || !Number.isFinite(d.ageYears)) {
    return null;
  }
  const ageYears = Math.round(d.ageYears);
  if (ageYears < 0 || ageYears > 120) return null;
  return { sex: sex as DemographicSex, ageYears };
}

/** Server-side scoring for draft / confirm flows — never trust client-built grades. */
export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { demographic?: unknown; markers?: ExtractedMarker[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const demographic = parseDemographic(body.demographic);
  if (!demographic) {
    return NextResponse.json(
      { error: "demographic (sex, ageYears) is required" },
      { status: 400 },
    );
  }
  if (!Array.isArray(body.markers) || body.markers.length === 0) {
    return NextResponse.json({ error: "markers required" }, { status: 400 });
  }

  const markers: ExtractedMarker[] = body.markers.map((m) => ({
    biomarkerId: m.biomarkerId ?? null,
    name: String(m.name ?? ""),
    value: typeof m.value === "number" ? m.value : null,
    valueDisplay:
      typeof m.valueDisplay === "string" ? m.valueDisplay : undefined,
    unit: String(m.unit ?? ""),
    confidence: typeof m.confidence === "number" ? m.confidence : 1,
  }));

  const report = buildReportViewModel({ markers, demographic });
  return NextResponse.json({ report });
}
