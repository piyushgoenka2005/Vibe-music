import "server-only";

import { disconnectPrisma } from "@/lib/db/prisma";
import { closeJobQueue } from "@/lib/server/jobQueue";
import { logInfo, logWarn } from "@/lib/server/logger";

const SHUTDOWN_TIMEOUT_MS = 30_000;

let registered = false;
let shuttingDown = false;

export function isShuttingDown(): boolean {
  return shuttingDown;
}

export async function runGracefulShutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  logInfo(`Graceful shutdown started (${signal})`, "graceful-shutdown");

  const forceExitTimer = setTimeout(() => {
    logWarn("Graceful shutdown timed out — forcing exit", "graceful-shutdown");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    await closeJobQueue();
    await disconnectPrisma();
    logInfo("Database pool closed", "graceful-shutdown");
  } catch (error) {
    logWarn(
      `Database disconnect failed: ${error instanceof Error ? error.message : String(error)}`,
      "graceful-shutdown",
    );
  } finally {
    clearTimeout(forceExitTimer);
  }

  if (process.env.NODE_ENV === "production") {
    process.exit(0);
  }
}

/** Register SIGTERM/SIGINT handlers once per Node process (PM2 deploy / local Ctrl+C). */
export function registerGracefulShutdown(): void {
  if (registered) return;
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") return;
  registered = true;

  const onSignal = (signal: string) => {
    void runGracefulShutdown(signal);
  };

  process.once("SIGTERM", () => onSignal("SIGTERM"));
  process.once("SIGINT", () => onSignal("SIGINT"));
}
