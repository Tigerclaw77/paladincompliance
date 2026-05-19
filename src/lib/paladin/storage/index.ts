import "server-only";

import { getStorageConfig } from "@/lib/paladin/storage/config";
import { createLocalStorageAdapter } from "@/lib/paladin/storage/local";
import { createUnavailableStorageAdapter } from "@/lib/paladin/storage/unavailable";
import type { StorageAdapter } from "@/lib/paladin/storage/types";

let storageAdapter: StorageAdapter | null = null;

export function getStorageAdapter() {
  storageAdapter ??= createStorageAdapter();

  return storageAdapter;
}

function createStorageAdapter() {
  const config = getStorageConfig();

  if (config.driver === "local" || config.driver === "vercel-tmp") {
    return createLocalStorageAdapter(config);
  }

  return createUnavailableStorageAdapter(config.driver);
}

export type { StorageAdapter };
