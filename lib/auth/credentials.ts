import { getOptionalDb } from "@/lib/cloudflare/bindings";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

const SESSION_DAYS = 30;
export const SESSION_COOKIE = "ba_session";

function id(): string {
  return crypto.randomUUID();
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
}): Promise<{ user: AuthUser } | { error: string }> {
  const db = await getOptionalDb();
  if (!db) {
    return {
      error:
        "Database unavailable. Ensure Cloudflare D1 is bound (wrangler.jsonc + next dev with OpenNext).",
    };
  }

  const email = input.email.trim().toLowerCase();
  if (!email.includes("@") || input.password.length < 8) {
    return { error: "Use a valid email and a password of at least 8 characters." };
  }

  const existing = await db
    .prepare(`SELECT id FROM user WHERE email = ?`)
    .bind(email)
    .first();
  if (existing) return { error: "An account with that email already exists." };

  const now = new Date().toISOString();
  const userId = id();
  const passwordHash = await hashPassword(input.password);
  const name = input.name.trim() || email.split("@")[0] || "Member";

  await db.batch([
    db
      .prepare(
        `INSERT INTO user (id, name, email, email_verified, image, created_at, updated_at)
         VALUES (?, ?, ?, 0, NULL, ?, ?)`,
      )
      .bind(userId, name, email, now, now),
    db
      .prepare(
        `INSERT INTO account
          (id, account_id, provider_id, user_id, password, created_at, updated_at)
         VALUES (?, ?, 'credential', ?, ?, ?, ?)`,
      )
      .bind(id(), email, userId, passwordHash, now, now),
    db
      .prepare(
        `INSERT INTO profiles (user_id, age_years, sex, created_at, updated_at)
         VALUES (?, NULL, NULL, ?, ?)`,
      )
      .bind(userId, now, now),
  ]);

  return { user: { id: userId, email, name } };
}

export async function authenticateUser(input: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser } | { error: string }> {
  const db = await getOptionalDb();
  if (!db) {
    return {
      error:
        "Database unavailable. Ensure Cloudflare D1 is bound (wrangler.jsonc + next dev with OpenNext).",
    };
  }

  const email = input.email.trim().toLowerCase();
  const row = await db
    .prepare(
      `SELECT u.id as id, u.email as email, u.name as name, a.password as password
       FROM user u
       JOIN account a ON a.user_id = u.id AND a.provider_id = 'credential'
       WHERE u.email = ?`,
    )
    .bind(email)
    .first<{ id: string; email: string; name: string; password: string | null }>();

  if (!row?.password) return { error: "Invalid email or password." };
  const ok = await verifyPassword(input.password, row.password);
  if (!ok) return { error: "Invalid email or password." };

  return { user: { id: row.id, email: row.email, name: row.name } };
}

export async function createSession(userId: string): Promise<string | null> {
  const db = await getOptionalDb();
  if (!db) return null;

  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db
    .prepare(
      `INSERT INTO session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id)
       VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)`,
    )
    .bind(
      id(),
      expires.toISOString(),
      token,
      now.toISOString(),
      now.toISOString(),
      userId,
    )
    .run();
  return token;
}

export async function getUserBySessionToken(
  token: string | undefined | null,
): Promise<AuthUser | null> {
  if (!token) return null;
  const db = await getOptionalDb();
  if (!db) return null;

  const row = await db
    .prepare(
      `SELECT u.id as id, u.email as email, u.name as name, s.expires_at as expires_at
       FROM session s
       JOIN user u ON u.id = s.user_id
       WHERE s.token = ?`,
    )
    .bind(token)
    .first<{ id: string; email: string; name: string; expires_at: string }>();

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await db.prepare(`DELETE FROM session WHERE token = ?`).bind(token).run();
    return null;
  }
  return { id: row.id, email: row.email, name: row.name };
}

export async function destroySession(token: string | undefined | null) {
  if (!token) return;
  const db = await getOptionalDb();
  if (!db) return;
  await db.prepare(`DELETE FROM session WHERE token = ?`).bind(token).run();
}
