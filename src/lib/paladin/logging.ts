import "server-only";

type LogLevel = "error" | "info" | "warn";
type LogMetadata = Record<string, boolean | null | number | string | undefined>;

export function logOperationalEvent(
  level: LogLevel,
  event: string,
  metadata: LogMetadata = {}
) {
  const payload = {
    event,
    ...metadata,
    at: new Date().toISOString(),
  };

  if (level === "error") {
    console.error("[paladin]", payload);
    return;
  }

  if (level === "warn") {
    console.warn("[paladin]", payload);
    return;
  }

  console.info("[paladin]", payload);
}
