/**
 * Session port — credential cookie auth against D1 today;
 * migrate to Better Auth + D1 (see lib/auth/README.md) without changing call sites.
 */

import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  getUserBySessionToken,
  type AuthUser,
} from "@/lib/auth/credentials";

export type AppSession = {
  userId: string;
  email: string | null;
  name: string | null;
};

/**
 * Returns the authenticated session, or null when the cookie is missing/invalid.
 * Never invents a synthetic user id — callers that need auth must use requireUser().
 */
export async function getAppSession(): Promise<AppSession | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const user = await getUserBySessionToken(token);
  if (!user) return null;
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function requireUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return getUserBySessionToken(token);
}

export { SESSION_COOKIE };
