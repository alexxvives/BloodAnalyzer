import { requireUser } from "@/lib/auth/session";
import { getReportRepository } from "@/lib/db/report-repository";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Single report + markers for the authenticated user only. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const result = await (await getReportRepository()).getReportForUser(
      user.id,
      id,
    );
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Storage unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
