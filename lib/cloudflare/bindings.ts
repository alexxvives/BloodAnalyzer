import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * In-memory D1/R2 stand-ins are for unit tests and local dev without bindings.
 * Production must fail closed — set ALLOW_MEMORY_STORE=1 only for explicit overrides.
 */
export function allowInMemoryDataStores(): boolean {
  if (process.env.ALLOW_MEMORY_STORE === "1") return true;
  return process.env.NODE_ENV !== "production";
}

/** Request-scoped Cloudflare bindings (D1 / R2). Safe when unbound in tests. */
export async function getOptionalDb(): Promise<D1Database | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.DB ?? null;
  } catch {
    return null;
  }
}

export async function getOptionalUploads(): Promise<R2Bucket | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.UPLOADS ?? null;
  } catch {
    return null;
  }
}
