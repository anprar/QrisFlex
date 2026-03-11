import { del, put } from "@vercel/blob";
import { kv } from "@vercel/kv";

import { featureFlags } from "@/lib/env";
import { slugify } from "@/lib/utils";

export interface BlobLease {
  id: string;
  url: string;
  expiresAt: number;
}

const globalForBlobStore = globalThis as typeof globalThis & {
  __qrisflexBlobLeases?: BlobLease[];
};

const memoryBlobLeases = globalForBlobStore.__qrisflexBlobLeases ??= [];

export async function saveEphemeralImage(options: {
  filename: string;
  contentType: string;
  body: Buffer | Uint8Array;
}) {
  if (!featureFlags.blob) {
    return null;
  }

  const lease: BlobLease = {
    id: crypto.randomUUID(),
    url: "",
    expiresAt: Date.now() + 60 * 60 * 1000,
  };
  const name = `uploads/${slugify(options.filename)}-${lease.id}`;
  const finalizedUpload = await put(name, Buffer.from(options.body), {
    access: "public",
    contentType: options.contentType,
    addRandomSuffix: false,
  });

  lease.url = finalizedUpload.url;

  if (featureFlags.kv) {
    await kv.set(`blob:${lease.id}`, lease);
    await kv.expire(`blob:${lease.id}`, 60 * 60);
  } else {
    memoryBlobLeases.push(lease);
  }

  return lease;
}

export async function cleanupExpiredBlobs() {
  const now = Date.now();
  const deleted: string[] = [];

  if (!featureFlags.blob) {
    return deleted;
  }

  if (!featureFlags.kv) {
    const survivors: BlobLease[] = [];

    for (const lease of memoryBlobLeases) {
      if (lease.expiresAt <= now) {
        await del(lease.url);
        deleted.push(lease.url);
      } else {
        survivors.push(lease);
      }
    }

    memoryBlobLeases.splice(0, memoryBlobLeases.length, ...survivors);
    return deleted;
  }

  const keys = await kv.keys("blob:*");

  for (const key of keys) {
    const lease = await kv.get<BlobLease>(key);

    if (lease && lease.expiresAt <= now) {
      await del(lease.url);
      await kv.del(key);
      deleted.push(lease.url);
    }
  }

  return deleted;
}
