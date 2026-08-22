import { getAuth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Server-side sign-out for AppShell (stable /api/auth/logout URL). */
export async function POST() {
  try {
    const auth = await getAuth();
    await auth.api.signOut({
      headers: await headers(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Logout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
