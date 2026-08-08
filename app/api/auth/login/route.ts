import {
  SESSION_COOKIE,
  authenticateUser,
  createSession,
} from "@/lib/auth/credentials";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const result = await authenticateUser({
    email: body.email ?? "",
    password: body.password ?? "",
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const token = await createSession(result.user.id);
  if (!token) {
    return NextResponse.json(
      { error: "Could not create session." },
      { status: 500 },
    );
  }

  const res = NextResponse.json({ user: result.user });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
