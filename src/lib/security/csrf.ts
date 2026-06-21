import "server-only";

export {
  verifyMutationOrigin,
  isWebhookPath,
  isMutationMethod,
} from "@/lib/security/mutation-origin";
