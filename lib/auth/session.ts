/**
 * Session port — Better Auth + D1.
 * Call sites should keep using requireUser() / getAppSession().
 */

import { headers } from "next/headers";
import { getAuth } from "@/lib/auth/auth";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type AppSession = {
  userId: string;
  email: string | null;
  name: string | null;
};

/**
 * Returns the authenticated session, or null when missing/invalid.
 * Never invents a synthetic user id.
 */
export async function getAppSession(): Promise<AppSession | null> {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return null;
    return {
      userId: session.user.id,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<AuthUser | null> {
  const session = await getAppSession();
  if (!session?.userId || !session.email) return null;
  return {
    id: session.userId,
    email: session.email,
    name: session.name ?? session.email.split("@")[0] ?? "Member",
  };
}

/** Better Auth session cookie name (presence check in middleware). */
export const SESSION_COOKIE = "better-auth.session_token";
