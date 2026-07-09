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

export interface AuditLogRecord {
  id: string;
  action: string;
  actorId: string | null;
  actorEmail: string | null;
  resourceType: string | null;
  resourceId: string | null;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export async function listRecentAuditLogs(
  limit = 100
): Promise<AuditLogRecord[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(AUDIT_LOGS_COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      action: String(data.action ?? ""),
      actorId: data.actorId != null ? String(data.actorId) : null,
      actorEmail: data.actorEmail != null ? String(data.actorEmail) : null,
      resourceType: data.resourceType != null ? String(data.resourceType) : null,
      resourceId: data.resourceId != null ? String(data.resourceId) : null,
      ip: data.ip != null ? String(data.ip) : null,
      userAgent: data.userAgent != null ? String(data.userAgent) : null,
      requestId: data.requestId != null ? String(data.requestId) : null,
      metadata:
        data.metadata && typeof data.metadata === "object"
          ? (data.metadata as Record<string, unknown>)
          : null,
      createdAt: String(data.createdAt ?? ""),
    };
  });
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
