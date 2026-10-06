#!/usr/bin/env npx tsx
/**
 * BullMQ background worker — run as PM2 `vibe-worker` when REDIS_URL is set.
 *
 *   npx tsx --tsconfig scripts/workers/tsconfig.json scripts/workers/job-worker.mts
 *   pm2 start deploy/ecosystem.config.cjs --only vibe-worker
 */
import { closeJobQueue, isJobQueueEnabled, startJobWorker } from "@/lib/server/jobQueue";
import { disconnectPrisma } from "@/lib/db/prisma";

async function main(): Promise<void> {
  if (!isJobQueueEnabled()) {
    console.log(
      "[vibe-worker] REDIS_URL is not set — webhooks run synchronously in the API; worker not needed.",
    );
    process.exit(0);
  }

  const worker = startJobWorker();

  const shutdown = async (signal: string) => {
    console.log(`[vibe-worker] Shutting down (${signal})…`);
    await worker.close();
    await closeJobQueue();
    await disconnectPrisma();
    process.exit(0);
  };

  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((error) => {
  console.error("[vibe-worker] Fatal error:", error);
  process.exit(1);
});
