import { getAuth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function handler(request: Request) {
  try {
    const auth = await getAuth();
    return auth.handler(request);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Auth service unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export const GET = handler;
export const POST = handler;
