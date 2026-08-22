/**
 * Better Auth instance (email/password) on Cloudflare D1.
 * Keeps requireUser()/getAppSession() as the app-facing port in session.ts.
 *
 * @see https://www.better-auth.com/docs/installation
 */

import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { getOptionalDb } from "@/lib/cloudflare/bindings";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

function authSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV !== "production") {
    return "dev-only-better-auth-secret-min-32-chars";
  }
  throw new Error(
    "BETTER_AUTH_SECRET must be set (32+ chars). Use: npx wrangler secret put BETTER_AUTH_SECRET",
  );
}

function authBaseURL(): string {
  return (
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

async function ensureProfileRow(userId: string) {
  const db = await getOptionalDb();
  if (!db) return;
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT OR IGNORE INTO profiles (user_id, age_years, sex, created_at, updated_at)
       VALUES (?, NULL, NULL, ?, ?)`,
    )
    .bind(userId, now, now)
    .run();
}

/**
 * D1 migrations use snake_case columns; Better Auth defaults to camelCase.
 * Map every core field so sign-in/sign-up don't query missing columns
 * (e.g. account.userId vs account.user_id).
 */
const snakeCaseAuthFields = {
  user: {
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  session: {
    fields: {
      userId: "user_id",
      expiresAt: "expires_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  account: {
    fields: {
      accountId: "account_id",
      providerId: "provider_id",
      userId: "user_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  verification: {
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
} as const;

function createAuth(db: D1Database) {
  return betterAuth({
    database: db,
    secret: authSecret(),
    baseURL: authBaseURL(),
    trustedOrigins: [
      authBaseURL(),
      ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ],
    ...snakeCaseAuthFields,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      // Keep existing PBKDF2 hashes from the pre–Better Auth credentials layer.
      password: {
        hash: async (password) => hashPassword(password),
        verify: async ({ hash, password }) => verifyPassword(password, hash),
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await ensureProfileRow(user.id);
          },
        },
      },
    },
    plugins: [nextCookies()],
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;

let cached: AuthInstance | null = null;
let cachedDb: D1Database | null = null;

/** Lazy Better Auth bound to the request's D1 database. */
export async function getAuth(): Promise<AuthInstance> {
  const db = await getOptionalDb();
  if (!db) {
    throw new Error(
      "D1 database binding is required for Better Auth. Bind DB in wrangler.jsonc.",
    );
  }

  if (cached && cachedDb === db) return cached;

  cachedDb = db;
  cached = createAuth(db);
  return cached;
}
