import { requireUser } from "@/lib/auth/session";
import { getReportRepository } from "@/lib/db/report-repository";
import { parseCollectedAt } from "@/lib/report/collected-at";
import { getUploadStore } from "@/lib/storage/uploads";
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

/** Update mutable report fields (currently collection date) for the owner. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { collectedAt?: unknown };
  const collectedAt = parseCollectedAt(body.collectedAt);
  if (!collectedAt) {
    return NextResponse.json(
      { error: "collectedAt (YYYY-MM-DD) is required" },
      { status: 400 },
    );
  }

  try {
    const report = await (
      await getReportRepository()
    ).updateCollectedAtForUser(user.id, id, collectedAt);
    if (!report) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Storage unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

/** Delete a report (and its R2 source file) for the authenticated owner only. */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const deleted = await (await getReportRepository()).deleteReportForUser(
      user.id,
      id,
    );
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const key = deleted.sourceFileKey;
    if (key?.startsWith(`users/${user.id}/`)) {
      try {
        await (await getUploadStore()).delete(key);
      } catch {
        // Report row is already gone; orphaned object cleanup can be retried later.
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Storage unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
