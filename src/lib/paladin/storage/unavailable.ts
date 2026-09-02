import "server-only";

import type { StorageAdapter } from "@/lib/paladin/storage/types";
import type { StorageDriver } from "@/lib/paladin/env";

export function createUnavailableStorageAdapter(
  driver: StorageDriver
): StorageAdapter {
  return {
    driver,
    async getObject() {
      return null;
    },
    isEphemeral: false,
    async putObject() {
      throw new Error(
        `${driver.toUpperCase()} storage is configured but no adapter is installed yet.`
      );
    },
  };
}
