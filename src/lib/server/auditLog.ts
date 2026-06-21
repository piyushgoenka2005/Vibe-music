import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { getClientIp } from "@/lib/security/rate-limit-core";
import { getRequestId } from "@/lib/security/request-log";
import { logInfo } from "@/lib/server/logger";

export const AUDIT_LOGS_COLLECTION = "auditLogs";

export interface AuditLogInput {
  action: string;
  actorId?: string;
  actorEmail?: string;
  resourceType?: string;
  resourceId?: string;
  request?: Request;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  const request = input.request;
  const record = {
    action: input.action,
    actorId: input.actorId ?? null,
    actorEmail: input.actorEmail ?? null,
    resourceType: input.resourceType ?? null,
    resourceId: input.resourceId ?? null,
    ip: request ? getClientIp(request) : null,
    userAgent: request?.headers.get("user-agent") ?? null,
    requestId: request ? getRequestId(request) : null,
    metadata: input.metadata ?? null,
    createdAt: new Date().toISOString(),
  };

  logInfo("Audit event", "audit", record);

  try {
    const db = getAdminFirestore();
    await db.collection(AUDIT_LOGS_COLLECTION).add(record);
  } catch (error) {
    logInfo("Audit log persistence failed", "audit", {
      action: input.action,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
