/** @deprecated Import from `@/lib/server/platform/jobQueue` — shim for legacy paths. */
export {
  closeJobQueue,
  isJobQueueEnabled,
  startJobWorker,
  enqueueRazorpayWebhook,
  getJobQueue,
  JOB_QUEUE_NAME,
  JOB_NAMES,
} from "@/lib/server/platform/jobQueue";
export type { RazorpayWebhookJobData, EnqueueWebhookResult } from "@/lib/server/platform/jobQueue";
export * from "@/lib/server/platform/jobQueue";
