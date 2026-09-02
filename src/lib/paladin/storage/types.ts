import type { StorageDriver } from "@/lib/paladin/env";

export type StoragePutInput = {
  body: Uint8Array;
  contentType: string;
  key: string;
};

export type StorageObject = {
  body: Uint8Array;
  contentType?: string;
  sizeBytes: number;
};

export type StorageAdapter = {
  driver: StorageDriver;
  getObject: (key: string) => Promise<StorageObject | null>;
  isEphemeral: boolean;
  putObject: (input: StoragePutInput) => Promise<void>;
};
