import { appendFileSync } from "fs";
import { join } from "path";

const LOG_PATH = join(process.cwd(), "debug-88ed4c.log");

export function debugSessionLog(entry: Record<string, unknown>): void {
  try {
    appendFileSync(
      LOG_PATH,
      `${JSON.stringify({ sessionId: "88ed4c", ...entry, timestamp: Date.now() })}\n`
    );
  } catch {
    /* debug logging is best-effort */
  }
}
