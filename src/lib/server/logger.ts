import "server-only";

type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  context?: string;
  error?: string;
  stack?: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}

function writeLog(payload: LogPayload): void {
  const line = JSON.stringify(payload);
  if (payload.level === "error") {
    console.error(line);
    return;
  }
  if (payload.level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}

export function logInfo(
  message: string,
  context?: string,
  meta?: Record<string, unknown>
): void {
  writeLog({
    level: "info",
    message,
    context,
    meta,
    timestamp: new Date().toISOString(),
  });
}

export function logWarn(
  message: string,
  context?: string,
  meta?: Record<string, unknown>
): void {
  writeLog({
    level: "warn",
    message,
    context,
    meta,
    timestamp: new Date().toISOString(),
  });
}

export function logError(
  message: string,
  error: unknown,
  context?: string,
  meta?: Record<string, unknown>
): void {
  writeLog({
    level: "error",
    message,
    context,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    meta,
    timestamp: new Date().toISOString(),
  });
}
