import { requireUser } from "@/lib/auth/session";
import { getReportRepository } from "@/lib/db/report-repository";
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

/** List reports for the authenticated user only. */
export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const reports = await (await getReportRepository()).listReportsForUser(
      user.id,
    );
    return NextResponse.json({
      reports,
      session: { userId: user.id, email: user.email },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Storage unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

/** Persist a confirmed extraction — always scoped to session user id. */
export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    sourceFileKey?: string | null;
    sourceFileName?: string | null;
    demographic?: unknown;
    markers?: Array<{
      biomarkerId: string | null;
      name: string;
      value: number | null;
      valueDisplay?: string;
      unit: string;
    }>;
  };

  if (!body.markers?.length) {
    return NextResponse.json({ error: "markers required" }, { status: 400 });
  }

  const demographic = parseDemographic(body.demographic);
  if (!demographic) {
    return NextResponse.json(
      { error: "demographic (sex, ageYears) is required" },
      { status: 400 },
    );
  }

  try {
    const report = await (
      await getReportRepository()
    ).saveReport({
      userId: user.id,
      sourceFileKey: body.sourceFileKey,
      sourceFileName: body.sourceFileName,
      demographic,
      markers: body.markers,
    });

    return NextResponse.json({ report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Storage unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
