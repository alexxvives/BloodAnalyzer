/**
 * Upload storage port. Prefers Cloudflare R2 with user-scoped keys;
 * falls back to in-memory only when allowInMemoryDataStores() is true.
 */

import {
  allowInMemoryDataStores,
  getOptionalUploads,
} from "@/lib/cloudflare/bindings";

export type StoredUpload = {
  key: string;
  contentType: string;
  size: number;
};

export type UploadStore = {
  put(
    key: string,
    data: ArrayBuffer,
    contentType: string,
  ): Promise<StoredUpload>;
  get(key: string): Promise<{ data: ArrayBuffer; contentType: string } | null>;
};

const memory = new Map<string, { data: ArrayBuffer; contentType: string }>();

export const memoryUploadStore: UploadStore = {
  async put(key, data, contentType) {
    memory.set(key, { data, contentType });
    return { key, contentType, size: data.byteLength };
  },
  async get(key) {
    return memory.get(key) ?? null;
  },
};

function createR2UploadStore(bucket: R2Bucket): UploadStore {
  return {
    async put(key, data, contentType) {
      await bucket.put(key, data, {
        httpMetadata: { contentType },
      });
      return { key, contentType, size: data.byteLength };
    },
    async get(key) {
      const obj = await bucket.get(key);
      if (!obj) return null;
      const data = await obj.arrayBuffer();
      return {
        data,
        contentType: obj.httpMetadata?.contentType || "application/octet-stream",
      };
    },
  };
}

/** Build a key; never store under a shared unscoped prefix. */
export function buildUploadKey(input: {
  userId: string;
  filename: string;
}): string {
  const safe = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `users/${input.userId}/uploads/${Date.now()}-${safe}`;
}

export async function getUploadStore(): Promise<UploadStore> {
  const bucket = await getOptionalUploads();
  if (bucket) return createR2UploadStore(bucket);
  if (allowInMemoryDataStores()) return memoryUploadStore;
  throw new Error(
    "R2 UPLOADS binding is required in production. Bind the bucket in wrangler.jsonc or set ALLOW_MEMORY_STORE=1 for an explicit override.",
  );
}
