import { Queue, Worker, type Job, type JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { logInfo, logWarn } from "@/lib/server/logger";
import type { WebhookProcessResult } from "@/lib/server/razorpayWebhookService";

export const JOB_QUEUE_NAME = "vibe-jobs";

export const JOB_NAMES = {
  RAZORPAY_WEBHOOK: "razorpay.webhook",
} as const;

export type RazorpayWebhookJobData = {
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
};

export type EnqueueWebhookResult =
  | { mode: "sync"; result: WebhookProcessResult }
  | { mode: "queued"; eventId: string; eventType: string };

const globalForQueue = globalThis as unknown as {
  vibeJobQueue: Queue | undefined;
  vibeRedis: IORedis | undefined;
};

export function isJobQueueEnabled(): boolean {
  return Boolean(process.env.REDIS_URL?.trim());
}

function createRedisConnection(): IORedis {
  const url = process.env.REDIS_URL!.trim();
  if (!globalForQueue.vibeRedis) {
    globalForQueue.vibeRedis = new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return globalForQueue.vibeRedis;
}

export function getJobQueue(): Queue | null {
  if (!isJobQueueEnabled()) return null;
  if (!globalForQueue.vibeJobQueue) {
    globalForQueue.vibeJobQueue = new Queue(JOB_QUEUE_NAME, {
      connection: createRedisConnection(),
    });
  }
  return globalForQueue.vibeJobQueue;
}

const webhookJobOptions: JobsOptions = {
  removeOnComplete: 1000,
  removeOnFail: 5000,
  attempts: 5,
  backoff: { type: "exponential", delay: 2000 },
};

export async function enqueueRazorpayWebhook(
  data: RazorpayWebhookJobData,
): Promise<EnqueueWebhookResult> {
  const queue = getJobQueue();
  if (!queue) {
    const { processRazorpayWebhook } = await import("@/lib/server/razorpayWebhookService");
    const result = await processRazorpayWebhook(data);
    return { mode: "sync", result };
  }

  await queue.add(JOB_NAMES.RAZORPAY_WEBHOOK, data, {
    ...webhookJobOptions,
    jobId: data.eventId,
  });

  return { mode: "queued", eventId: data.eventId, eventType: data.eventType };
}

async function processRazorpayWebhookJob(data: RazorpayWebhookJobData): Promise<void> {
  const { processRazorpayWebhook } = await import("@/lib/server/razorpayWebhookService");
  await processRazorpayWebhook(data);
}

async function runJob(job: Job): Promise<void> {
  switch (job.name) {
    case JOB_NAMES.RAZORPAY_WEBHOOK:
      await processRazorpayWebhookJob(job.data as RazorpayWebhookJobData);
      return;
    default:
      throw new Error(`Unknown job name: ${job.name}`);
  }
}

/** Standalone worker entry (PM2 `vibe-worker` process). */
export function startJobWorker(): Worker {
  if (!isJobQueueEnabled()) {
    throw new Error("REDIS_URL is required to start the job worker");
  }

  const worker = new Worker(JOB_QUEUE_NAME, runJob, {
    connection: createRedisConnection(),
    concurrency: 5,
  });

  worker.on("completed", (job: Job) => {
    logInfo(`Job completed: ${job.name} (${job.id})`, "job-worker");
  });

  worker.on("failed", (job: Job | undefined, error: Error) => {
    logWarn(
      `Job failed: ${job?.name ?? "unknown"} (${job?.id ?? "n/a"}): ${error.message}`,
      "job-worker",
    );
  });

  logInfo("BullMQ worker started", "job-worker");
  return worker;
}

export async function closeJobQueue(): Promise<void> {
  if (globalForQueue.vibeJobQueue) {
    await globalForQueue.vibeJobQueue.close();
    globalForQueue.vibeJobQueue = undefined;
  }
  if (globalForQueue.vibeRedis) {
    await globalForQueue.vibeRedis.quit();
    globalForQueue.vibeRedis = undefined;
  }
}
