import { requireUser } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user });
}
