import { requireUser } from "@/lib/auth/session";
import { getReportRepository } from "@/lib/db/report-repository";
import { getUploadStore } from "@/lib/storage/uploads";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Stream the original uploaded lab file for a report the user owns.
 * Keys are user-scoped; still verified against session user_id.
 */
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

    const key = result.report.sourceFileKey;
    if (!key) {
      return NextResponse.json(
        { error: "No original file for this report" },
        { status: 404 },
      );
    }

    const prefix = `users/${user.id}/uploads/`;
    if (!key.startsWith(prefix)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const stored = await (await getUploadStore()).get(key);
    if (!stored) {
      return NextResponse.json(
        { error: "File no longer available" },
        { status: 404 },
      );
    }

    const filename =
      result.report.sourceFileName?.replace(/[^\w.\- ()[\]]+/g, "_") ||
      "lab-report";

    return new NextResponse(new Uint8Array(stored.data), {
      status: 200,
      headers: {
        "Content-Type": stored.contentType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Storage unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
