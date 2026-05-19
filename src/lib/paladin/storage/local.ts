import "server-only";

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageConfig } from "@/lib/paladin/storage/config";
import type {
  StorageAdapter,
  StorageObject,
  StoragePutInput,
} from "@/lib/paladin/storage/types";

const metadataExtension = ".metadata.json";

export function createLocalStorageAdapter(config: StorageConfig): StorageAdapter {
  if (!config.rootDirectory) {
    throw new Error("Local storage requires a root directory.");
  }

  const rootDirectory = config.rootDirectory;

  return {
    driver: config.driver,
    async getObject(key: string): Promise<StorageObject | null> {
      const filePath = resolveStoragePath(rootDirectory, key);

      try {
        const [body, fileStat, metadata] = await Promise.all([
          readFile(filePath),
          stat(filePath),
          readMetadata(filePath),
        ]);

        return {
          body,
          contentType: metadata.contentType,
          sizeBytes: fileStat.size,
        };
      } catch (error) {
        if (isMissingFileError(error)) {
          return null;
        }

        throw error;
      }
    },
    isEphemeral: config.isEphemeral,
    async putObject(input: StoragePutInput) {
      const filePath = resolveStoragePath(rootDirectory, input.key);

      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, input.body);
      await writeFile(
        `${filePath}${metadataExtension}`,
        JSON.stringify({ contentType: input.contentType }, null, 2)
      );
    },
  };
}

function resolveStoragePath(rootDirectory: string, key: string) {
  const safeKey = key
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join(path.sep);
  const filePath = path.join(/* turbopackIgnore: true */ rootDirectory, safeKey);

  if (!filePath.startsWith(rootDirectory)) {
    throw new Error("Invalid storage key.");
  }

  return filePath;
}

async function readMetadata(filePath: string) {
  try {
    const metadata = await readFile(`${filePath}${metadataExtension}`, "utf8");
    const parsedMetadata = JSON.parse(metadata) as { contentType?: unknown };

    return {
      contentType:
        typeof parsedMetadata.contentType === "string"
          ? parsedMetadata.contentType
          : undefined,
    };
  } catch (error) {
    if (isMissingFileError(error)) {
      return {};
    }

    throw error;
  }
}

function isMissingFileError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
