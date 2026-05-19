import "server-only";

import path from "node:path";
import {
  getStorageDriver,
  type StorageDriver,
} from "@/lib/paladin/env";

export type StorageConfig = {
  driver: StorageDriver;
  isEphemeral: boolean;
  rootDirectory?: string;
};

export function getStorageConfig(): StorageConfig {
  const driver = getStorageDriver();

  if (driver === "vercel-tmp") {
    return {
      driver,
      isEphemeral: true,
      rootDirectory: path.join("/tmp", "paladin-assets"),
    };
  }

  if (driver === "local") {
    return {
      driver,
      isEphemeral: false,
      rootDirectory: getLocalStorageRoot(),
    };
  }

  return {
    driver,
    isEphemeral: false,
  };
}

function getLocalStorageRoot() {
  if (process.env.PALADIN_STORAGE_ROOT) {
    return path.resolve(
      /* turbopackIgnore: true */ process.env.PALADIN_STORAGE_ROOT
    );
  }

  return path.join(/* turbopackIgnore: true */ process.cwd(), ".paladin-assets");
}
